'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              <Link href="/messages" className={styles.navLink}>Messages</Link>
              <div className={styles.profileMenuWrap} ref={profileMenuRef}>
                <button
                  type="button"
                  className={styles.profileTrigger}
                  onClick={() => setMenuOpen((prev) => !prev)}
                >
                  Profile
                </button>
                {menuOpen && (
                  <div className={styles.profileMenu}>
                    <Link href="/profile#account-info" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      Account Info
                    </Link>
                    <Link href="/profile#reset-password" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      Reset Password
                    </Link>
                    <Link href="/profile#unblock-list" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      Unblock Users List
                    </Link>
                    <Link href="/my-posts" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      My Posts
                    </Link>
                    {currentUser.role === 'admin' && (
                      <Link href="/admin" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`${styles.profileMenuItem} ${styles.profileLogout}`}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
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
