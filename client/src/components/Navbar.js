'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandIcon}>🔍</span>
          <span className={styles.brandText}>Campus Lost & Found</span>
        </Link>

        <div className={styles.links}>
          <Link href="/lost-items" className={styles.navLink}>Lost Items</Link>
          <Link href="/found-items" className={styles.navLink}>Found Items</Link>

          {currentUser ? (
            <>
              <Link href="/report-lost" className={`${styles.navLink} ${styles.btnReportLost}`}>
                Report Lost
              </Link>
              <Link href="/report-found" className={`${styles.navLink} ${styles.btnReportFound}`}>
                Report Found
              </Link>
              {currentUser.role === 'admin' && (
                <Link href="/admin" className={`${styles.navLink} ${styles.btnAdmin}`}>
                  Admin
                </Link>
              )}
              <Link href="/messages" className={styles.navLink}>Messages</Link>
              <Link href="/my-posts" className={styles.navLink}>My Posts</Link>
              <button onClick={handleLogout} className={styles.btnLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>Login</Link>
              <Link href="/register" className={`${styles.navLink} ${styles.btnRegister}`}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
