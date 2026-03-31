'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { changePassword, setAuthToken } from '@/lib/api';
import styles from '../sections.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to reset password</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
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
      setChanging(true);
      await changePassword(currentPassword, newPassword);
      setAuthToken(null);
      await logout();
      router.push('/login');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="pageContainer">
      <div className={styles.page}>
        <Link href="/profile" className={styles.backLink}>← Back to Profile</Link>
        <div className={styles.card}>
          <h1>Reset Password</h1>
          <p className={styles.helper}>Works for every account, including admins.</p>
          {error && <div className="errorMessage">{error}</div>}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="formGroup">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="formGroup">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="formGroup">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btnPrimary" disabled={changing}>
              {changing ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
