'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  changePassword,
  getBlockedUsers,
  unblockUser,
} from '@/lib/api';
import { setAuthToken } from '@/lib/api';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchBlockedUsers();
    }
  }, [currentUser]);

  const fetchBlockedUsers = async () => {
    try {
      const res = await getBlockedUsers();
      setBlockedUsers(res.data || []);
    } catch (err) {
      setBlockedUsers([]);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Force re-auth after password changes.
      setAuthToken(null);
      await logout();
      router.push('/login');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      setUnblockingId(userId);
      await unblockUser(userId);
      setSuccess('User unblocked');
      setError('');
      await fetchBlockedUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to unblock user');
    } finally {
      setUnblockingId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to view your profile</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <div className={styles.profilePage}>
        <div className={styles.header}>
          <h1>Profile & Settings</h1>
          <p>Manage your account, password, and blocked users.</p>
        </div>

        <div className={styles.quickActions}>
          <Link href="/messages" className="btn">Messages</Link>
          <Link href="/my-posts" className="btn">My Posts</Link>
          {currentUser.role === 'admin' && (
            <Link href="/admin" className="btn btnPrimary">Admin Dashboard</Link>
          )}
        </div>

        {error && <div className="errorMessage">{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        <section className={styles.sectionCard}>
          <h2>Account Info</h2>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.label}>Email</span>
              <p>{currentUser.email}</p>
            </div>
            <div>
              <span className={styles.label}>Display Name</span>
              <p>{currentUser.displayName}</p>
            </div>
            <div>
              <span className={styles.label}>Role</span>
              <p>{currentUser.role}</p>
            </div>
            <div>
              <span className={styles.label}>Account Status</span>
              <p>{currentUser.account_status}</p>
            </div>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <h2>Reset Password</h2>
          <p className={styles.helperText}>This works for every account type, including admins.</p>
          <form className={styles.form} onSubmit={handleChangePassword}>
            <div className="formGroup">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btnPrimary" disabled={changingPassword}>
              {changingPassword ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </section>

        <section className={styles.sectionCard}>
          <h2>Unblock Users List</h2>
          {blockedUsers.length === 0 ? (
            <p className={styles.helperText}>No blocked users.</p>
          ) : (
            <div className={styles.blockedList}>
              {blockedUsers.map((user) => (
                <div key={user.user_id} className={styles.blockedRow}>
                  <span>{user.email}</span>
                  <button
                    type="button"
                    className="btn btnSmall"
                    onClick={() => handleUnblock(user.user_id)}
                    disabled={unblockingId === user.user_id}
                  >
                    {unblockingId === user.user_id ? 'Unblocking...' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
