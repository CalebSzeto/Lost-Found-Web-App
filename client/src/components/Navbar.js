'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getConversations } from '@/lib/api';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
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

  React.useEffect(() => {
    let disposed = false;

    const loadUnreadCount = async () => {
      if (!currentUser) {
        setUnreadCount(0);
        return;
      }

      try {
        const res = await getConversations();
        const totalUnread = (res.data || []).reduce((sum, convo) => sum + (Number(convo.unread) || 0), 0);
        if (!disposed) {
          setUnreadCount(totalUnread);
        }
      } catch (err) {
        if (!disposed) {
          setUnreadCount(0);
        }
      }
    };

    loadUnreadCount();

    if (!currentUser) {
      return () => {
        disposed = true;
      };
    }

    const intervalId = setInterval(loadUnreadCount, 30000);
    return () => {
      disposed = true;
      clearInterval(intervalId);
    };
  }, [currentUser]);

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
              <Link href="/messages" className={`${styles.navLink} ${styles.messagesLink}`}>
                Messages
                {unreadCount > 0 && (
                  <span className={styles.messageBadge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/report-issue" className={styles.navLink}>
                Report Issue
              </Link>
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
                    <Link href="/profile/account-info" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      Account Info
                    </Link>
                    <Link href="/profile/reset-password" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      Reset Password
                    </Link>
                    <Link href="/profile/unblock-list" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      Unblock Users List
                    </Link>
                    <Link href="/my-posts" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      My Posts
                    </Link>
                    {currentUser.role === 'admin' && (
                      <>
                        <Link href="/admin" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                          Admin Dashboard
                        </Link>
                        <Link href="/admin/reports" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                          Admin Reports
                        </Link>
                      </>
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
