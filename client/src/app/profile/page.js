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
          <p>Choose a tool below. Each option is on a separate page.</p>
        </div>

        <div className={styles.optionsGrid}>
          <Link href="/profile/account-info" className={styles.optionCard}>
            <h2>Account Info</h2>
            <p>View email, display name, role, and account status.</p>
          </Link>

          <Link href="/profile/reset-password" className={styles.optionCard}>
            <h2>Reset Password</h2>
            <p>Change your password securely.</p>
          </Link>

          <Link href="/profile/unblock-list" className={styles.optionCard}>
            <h2>Unblock Users List</h2>
            <p>See all blocked users and unblock them.</p>
          </Link>

          <Link href="/my-posts" className={styles.optionCard}>
            <h2>My Posts</h2>
            <p>Go to all posts you created previously.</p>
          </Link>

          {currentUser.role === 'admin' && (
            <Link href="/admin" className={styles.optionCard}>
              <h2>Admin Dashboard</h2>
              <p>Admin moderation and management tools.</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
