'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../sections.module.css';

export default function AccountInfoPage() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to view account info</h3>
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
          <h1>Account Info</h1>
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
        </div>
      </div>
    </div>
  );
}
