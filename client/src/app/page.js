'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const AUTH_NOTICE_KEY = 'reunite.authNotice';
const AUTH_NOTICE_EVENT = 'auth:logout-notice';

export default function Home() {
  const { currentUser } = useAuth();
  const [logoutNotice, setLogoutNotice] = React.useState('');

  React.useEffect(() => {
    const syncNotice = () => {
      if (typeof window === 'undefined') return;

      const message = sessionStorage.getItem(AUTH_NOTICE_KEY);
      if (message) {
        setLogoutNotice(message);
        sessionStorage.removeItem(AUTH_NOTICE_KEY);
      }
    };

    syncNotice();
    window.addEventListener(AUTH_NOTICE_EVENT, syncNotice);
    return () => window.removeEventListener(AUTH_NOTICE_EVENT, syncNotice);
  }, []);

  return (
    <main className={styles.page}>
      {logoutNotice && (
        <div className={styles.logoutNotice} role="status" aria-live="polite">
          {logoutNotice}
        </div>
      )}

      <section className={styles.heroSection}>
        <p className={styles.kicker}>Campus Lost and Found</p>
        <div className={styles.heroHeader}>
          <h1>Find belongings faster with one trusted hub.</h1>
          <p className={styles.heroLead}>
            Reunite gives students one clear workflow to report lost items, return found items, and
            message safely without relying on scattered group chats.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/lost-items" className={`${styles.heroButton} ${styles.heroPrimary}`}>
            Browse Lost Items
          </Link>
          <Link href="/found-items" className={`${styles.heroButton} ${styles.heroSecondary}`}>
            Browse Found Items
          </Link>
        </div>

        <div className={styles.guideGrid}>
          <article className={styles.guideCard}>
            <h2>Browse and post</h2>
            <ul>
              <li>Use lost and found listings to quickly check active reports.</li>
              <li>Filter by keyword and location to narrow results.</li>
              <li>Create a detailed report with title, date, location, and image.</li>
            </ul>
          </article>

          <article className={styles.guideCard}>
            <h2>Message with confidence</h2>
            <ol>
              <li>Open an item detail page and start a conversation.</li>
              <li>Share match details privately to confirm ownership.</li>
              <li>Track unread replies from the messages badge.</li>
            </ol>
          </article>

          <article className={styles.guideCard}>
            <h2>Report safety issues</h2>
            <ul>
              <li>Submit abuse, spam, or suspicious behavior directly to admins.</li>
              <li>Copy the post ID from a listing card and attach it to your report.</li>
              <li>Review responses from admins in My Reports.</li>
            </ul>
          </article>

          <article className={styles.guideCard}>
            <h2>Manage your account</h2>
            <ul>
              <li>Review account status and update your password.</li>
              <li>Edit your own posts from the My Posts section.</li>
              <li>Unblock users and track report responses from profile tools.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.quickActions}>
        <div className={styles.quickHeader}>
          <h2>Quick actions</h2>
          <p>Start with the most common tasks below.</p>
        </div>
        <div className={styles.actionGrid}>
          <Link href="/lost-items" className={styles.actionCard}>
            <h3>Browse Lost Items</h3>
            <p>Check recently reported lost belongings.</p>
          </Link>
          <Link href="/found-items" className={styles.actionCard}>
            <h3>Browse Found Items</h3>
            <p>See what has been found around campus.</p>
          </Link>
          {currentUser ? (
            <>
              <Link href="/report-lost" className={styles.actionCard}>
                <h3>Report a Lost Item</h3>
                <p>Create a post to help others identify your item.</p>
              </Link>
              <Link href="/report-found" className={styles.actionCard}>
                <h3>Report a Found Item</h3>
                <p>Post details so the owner can contact you.</p>
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className={styles.actionCard}>
                <h3>Create an Account</h3>
                <p>Sign up with your school email to post and message.</p>
              </Link>
              <Link href="/login" className={styles.actionCard}>
                <h3>Sign In</h3>
                <p>Access your profile, posts, and messages.</p>
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
