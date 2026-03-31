'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { currentUser } = useAuth();

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
          <p>Choose an option below. Each setting is on its own page.</p>
        </div>

        <div className={styles.optionsGrid}>
          <Link href="/profile/account-info" className={styles.optionCard}>
            <h2>Account Info</h2>
            <p>View your email, role, and account status.</p>
          </Link>

          <Link href="/profile/reset-password" className={styles.optionCard}>
            <h2>Reset Password</h2>
            <p>Change your password for this account.</p>
          </Link>

          <Link href="/profile/unblock-list" className={styles.optionCard}>
            <h2>Unblock List</h2>
            <p>See blocked users and unblock them.</p>
          </Link>

          <Link href="/my-posts" className={styles.optionCard}>
            <h2>My Posts</h2>
            <p>View all posts you previously created.</p>
          </Link>

          {currentUser.role === 'admin' && (
            <Link href="/admin" className={styles.optionCard}>
              <h2>Admin Dashboard</h2>
              <p>Admin-only moderation and account controls.</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
