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
            This website helps students recover lost items, return found belongings, and communicate
            safely. Below is a complete guide to the key features so new users can understand exactly
            what to do from their first visit.
          </p>
        </div>

        <div className={styles.infoGrid}>
          <article className={styles.infoCard}>
            <h2>1) Browsing and Posting</h2>
            <ul>
              <li>Browse Lost Items and Found Items pages to check current reports.</li>
              <li>Use the filters (keyword, location, date, sort) to narrow results. Remember to click search to apply filters when searching by keyword or location, and click clear to remove filters</li>
              <li>Report Lost and Report Found pages let you publish a new post with details and images.</li>
              <li>Include title, location, date, and unique identifiers to improve match quality.</li>
            </ul>
          </article>

          <article className={styles.infoCard}>
            <h2>2) How to Message Post Owners</h2>
            <ol>
              <li>Open the post details page for the item you think is relevant.</li>
              <li>Use the message action on that post to start a conversation.</li>
              <li>Explain why you believe it is a match and share verification details.</li>
              <li>Check the Messages page and navbar unread badge for replies.</li>
            </ol>
          </article>

          <article className={styles.infoCard}>
            <h2>3) Report to Admin</h2>
            <ul>
              <li>If you see abuse, spam, or suspicious activity, report it to admin immediately.</li>
              <li>Reports require a Related Post ID. Click Copy ID on the post card, then paste it into the report.</li>
              <li>Include a short reason in the description so admins can act quickly.</li>
              <li>Admins can moderate accounts, posts, and messages from the Admin Dashboard.</li>
              <li>For urgent issues, report first and avoid direct confrontation in chat.</li>
            </ul>
          </article>

          <article className={styles.infoCard}>
            <h2>4) Profile and Tools</h2>
            <ul>
              <li>Account Info shows your role and account status.</li>
              <li>Reset Password updates credentials for account security.</li>
              <li>Unblock List lets you reverse accidental blocks.</li>
              <li>My Posts lets you edit your own posts by clicking a post card (title, description, location, date, and image).</li>
              <li>Images support JPG, PNG, WEBP up to 4MB.</li>
              <li>My Reports shows admin responses with a New Response badge per report.</li>
            </ul>
          </article>
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
