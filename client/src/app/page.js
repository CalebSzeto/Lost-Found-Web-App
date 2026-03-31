'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <main className={styles.page}>
      <section className={styles.introSection}>
        <div className={styles.introHeader}>
          <h1>Welcome to Your Campus Lost and Found Platform</h1>
          <p className={styles.introLead}>
            This website helps students quickly recover lost belongings and return found items to
            the right owner. Everything is designed for fast posting, direct communication, and
            clear account tools.
          </p>
        </div>

        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <h2>Core Features</h2>
            <ul>
              <li>Browse all lost and found reports with latest-first sorting.</li>
              <li>Create lost or found item posts with descriptions and images.</li>
              <li>Open any post and message the other user directly.</li>
              <li>Manage your posts and account settings from Profile.</li>
            </ul>
          </article>

          <article className={styles.infoCard}>
            <h2>How to Use It</h2>
            <ol>
              <li>Start in Lost Items or Found Items and look for a match.</li>
              <li>If no match exists, submit a detailed report post.</li>
              <li>Use Messages to coordinate pickup and verify ownership.</li>
              <li>Mark your process complete once the item is returned.</li>
            </ol>
          </article>

          <article className={styles.infoCard}>
            <h2>Important Notes</h2>
            <ul>
              <li>Use clear item details, date, and location to improve matching.</li>
              <li>Check your Messages tab regularly for new replies.</li>
              <li>Use Unblock List in Profile if you accidentally block someone.</li>
              <li>Contact an admin if you have account-access issues.</li>
            </ul>
          </article>
        </div>

        <div className={styles.ctaRow}>
          {currentUser ? (
            <>
              <Link href="/lost-items" className="btn btnPrimary">Go to Lost Items</Link>
              <Link href="/found-items" className="btn btnPrimary">Go to Found Items</Link>
            </>
          ) : (
            <>
              <Link href="/register" className="btn btnPrimary">Create Account</Link>
              <Link href="/login" className="btn btnOutline">Sign In</Link>
            </>
          )}
        </div>
      </section>

      <section className={styles.quickActions}>
        <h2>Quick Actions</h2>
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
