'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getBlockedUsers, unblockUser } from '@/lib/api';
import styles from '../sections.module.css';

export default function UnblockListPage() {
  const { currentUser } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchBlockedUsers();
    }
  }, [currentUser]);

  const fetchBlockedUsers = async () => {
    try {
      setError('');
      const res = await getBlockedUsers();
      setBlockedUsers(res.data || []);
    } catch (err) {
      const apiError = err?.response?.data?.error;
      const accountStatus = err?.response?.data?.account_status;

      if (accountStatus === 'banned') {
        setError(apiError || 'Your account is banned. Unblock list is unavailable.');
      } else if (accountStatus === 'restricted') {
        setError(apiError || 'Your account is restricted. Unblock list is unavailable.');
      } else {
        setError(apiError || 'Failed to load blocked users');
      }

      setBlockedUsers([]);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      setBusyId(userId);
      setError('');
      await unblockUser(userId);
      await fetchBlockedUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to unblock user');
    } finally {
      setBusyId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to view unblock list</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <div className={styles.page}>
        <Link href="/profile" className={styles.backLink}>← Back to Profile</Link>
        <div className={styles.card}>
          <h1>Unblock List</h1>
          {error && <div className="errorMessage">{error}</div>}
          {!error && blockedUsers.length === 0 ? (
            <p className={styles.helper}>No blocked users.</p>
          ) : (
            !error && (
              <div className={styles.blockedList}>
                {blockedUsers.map((user) => (
                  <div key={user.user_id} className={styles.blockedRow}>
                    <span>{user.email}</span>
                    <button
                      type="button"
                      className="btn btnSmall"
                      onClick={() => handleUnblock(user.user_id)}
                      disabled={busyId === user.user_id}
                    >
                      {busyId === user.user_id ? 'Unblocking...' : 'Unblock'}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
