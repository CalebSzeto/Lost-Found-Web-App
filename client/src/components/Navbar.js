'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminListReports, getConversations, getMyReports } from '@/lib/api';
import styles from './Navbar.module.css';

const ADMIN_REPORTS_SEEN_MAP_KEY_PREFIX = 'adminReports:seenMap:';
const ADMIN_REPORTS_SEEN_EVENT = 'admin-reports:seen';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [reportResponseCount, setReportResponseCount] = React.useState(0);
  const [adminReportCount, setAdminReportCount] = React.useState(0);
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
    setMenuOpen(false);
  }, [currentUser?.uid, currentUser?.role]);


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

    const handleReadRefresh = () => {
      loadUnreadCount();
    };

    loadUnreadCount();

    if (typeof window !== 'undefined') {
      window.addEventListener('messages:read', handleReadRefresh);
    }

    if (!currentUser) {
      return () => {
        disposed = true;
        if (typeof window !== 'undefined') {
          window.removeEventListener('messages:read', handleReadRefresh);
        }
      };
    }

    const intervalId = setInterval(loadUnreadCount, 5000);
    return () => {
      disposed = true;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('messages:read', handleReadRefresh);
      }
    };
  }, [currentUser]);

  React.useEffect(() => {
    let disposed = false;

    const loadAdminReportCount = async () => {
      if (!currentUser || currentUser.role !== 'admin') {
        setAdminReportCount(0);
        return;
      }

      try {
        const key = `${ADMIN_REPORTS_SEEN_MAP_KEY_PREFIX}${currentUser.uid}`;
        const seenRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        let seenMap = {};
        try {
          seenMap = seenRaw ? JSON.parse(seenRaw) : {};
        } catch {
          seenMap = {};
        }
        const res = await adminListReports({ status: 'open' });
        const reports = Array.isArray(res.data) ? res.data : [];
        const count = reports.reduce((sum, report) => {
          return seenMap?.[report._id] ? sum : sum + 1;
        }, 0);

        if (!disposed) {
          setAdminReportCount(count);
        }
      } catch (err) {
        if (!disposed) {
          setAdminReportCount(0);
        }
      }
    };

    const handleSeen = () => {
      loadAdminReportCount();
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        loadAdminReportCount();
      }
    };

    loadAdminReportCount();

    if (typeof window !== 'undefined') {
      window.addEventListener(ADMIN_REPORTS_SEEN_EVENT, handleSeen);
      window.addEventListener('focus', handleVisibilityRefresh);
      document.addEventListener('visibilitychange', handleVisibilityRefresh);
    }

    if (!currentUser || currentUser.role !== 'admin') {
      return () => {
        disposed = true;
        if (typeof window !== 'undefined') {
          window.removeEventListener(ADMIN_REPORTS_SEEN_EVENT, handleSeen);
          window.removeEventListener('focus', handleVisibilityRefresh);
          document.removeEventListener('visibilitychange', handleVisibilityRefresh);
        }
      };
    }

    const intervalId = setInterval(loadAdminReportCount, 5000);
    return () => {
      disposed = true;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener(ADMIN_REPORTS_SEEN_EVENT, handleSeen);
        window.removeEventListener('focus', handleVisibilityRefresh);
        document.removeEventListener('visibilitychange', handleVisibilityRefresh);
      }
    };
  }, [currentUser]);

  const profileBadgeCount = currentUser?.role === 'admin'
    ? adminReportCount + reportResponseCount
    : reportResponseCount;

  React.useEffect(() => {
    let disposed = false;

    const getLastResponseTimestamp = (report) => {
      const history = Array.isArray(report.response_history) ? report.response_history : [];
      if (history.length > 0) {
        return history.reduce((latest, entry) => {
          const value = entry?.at ? new Date(entry.at).getTime() : 0;
          return value > latest ? value : latest;
        }, 0);
      }

      return report.last_response_at ? new Date(report.last_response_at).getTime() : 0;
    };

    const loadReportResponses = async () => {
      if (!currentUser) {
        setReportResponseCount(0);
        return;
      }

      try {
        const res = await getMyReports();
        const reports = res.data || [];
        const key = `reports:lastSeenMap:${currentUser.uid}`;
        const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        let lastSeenMap = {};
        try {
          lastSeenMap = stored ? JSON.parse(stored) : {};
        } catch (parseError) {
          lastSeenMap = {};
        }
        const count = reports.reduce((sum, report) => {
          const latestResponse = getLastResponseTimestamp(report);
          const lastSeenRaw = lastSeenMap?.[report._id];
          const lastSeen = lastSeenRaw ? new Date(lastSeenRaw).getTime() : 0;
          return latestResponse > lastSeen ? sum + 1 : sum;
        }, 0);

        if (!disposed) {
          setReportResponseCount(count);
        }
      } catch (err) {
        if (!disposed) {
          setReportResponseCount(0);
        }
      }
    };

    const handleReportRead = () => {
      loadReportResponses();
    };

    loadReportResponses();

    if (typeof window !== 'undefined') {
      window.addEventListener('reports:read', handleReportRead);
    }

    if (!currentUser) {
      return () => {
        disposed = true;
      };
    }

    const intervalId = setInterval(loadReportResponses, 5000);
    return () => {
      disposed = true;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('reports:read', handleReportRead);
      }
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
          <img className={styles.brandIcon} src="/logo.svg" alt="Reunite" />
          <span className={styles.brandText}>Reunite</span>
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
                  {profileBadgeCount > 0 && (
                    <span className={styles.reportBadge}>
                      {profileBadgeCount > 99 ? '99+' : profileBadgeCount}
                    </span>
                  )}
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
                    <Link href="/my-reports" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                      <span>My Reports</span>
                      {reportResponseCount > 0 && (
                        <span className={styles.reportMenuBadge}>
                          {reportResponseCount > 99 ? '99+' : reportResponseCount}
                        </span>
                      )}
                    </Link>
                    {currentUser.role === 'admin' && (
                      <>
                        <Link href="/admin" className={styles.profileMenuItem} onClick={() => setMenuOpen(false)}>
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/admin/reports"
                          className={styles.profileMenuItem}
                          onClick={() => setMenuOpen(false)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Admin Reports</span>
                          {adminReportCount > 0 && (
                            <span className={styles.adminReportMenuBadge}>
                              {adminReportCount > 99 ? '99+' : adminReportCount}
                            </span>
                          )}
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
