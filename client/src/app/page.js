'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function Home() {
  const { currentUser } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Lost Something on Campus?</h1>
          <p className={styles.heroSubtitle}>
            Our platform connects students who&apos;ve lost items with those who&apos;ve found them.
            Report lost belongings, browse found items, and message finders directly.
          </p>
          <div className={styles.heroActions}>
            {currentUser ? (
              <>
                <Link href="/report-lost" className="btn btnPrimary btnLg">
                  🔴 Report Lost Item
                </Link>
                <Link href="/report-found" className="btn btnSuccess btnLg">
                  🟢 Report Found Item
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn btnPrimary btnLg">
                  Get Started
                </Link>
                <Link href="/login" className="btn btnOutline btnLg">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
        import React, { useState } from 'react';
            <h3>Sign Up</h3>
        import { useRouter } from 'next/navigation';
            <p>Create an account with your school email to get started.</p>
        import SearchBar from '@/components/SearchBar';
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3>Report</h3>
          const router = useRouter();
          const [searchType, setSearchType] = useState('lost');

          const handleSearch = (filters) => {
            const basePath = searchType === 'found' ? '/found-items' : '/lost-items';
            const params = new URLSearchParams();

            Object.entries(filters || {}).forEach(([key, value]) => {
              if (value !== undefined && value !== null && String(value).trim() !== '') {
                params.set(key, String(value));
              }
            });

            const query = params.toString();
            router.push(query ? `${basePath}?${query}` : basePath);
          };
            <p>Post details about a lost or found item with location info.</p>
          </div>
            <main className={styles.page}>
              <section className={styles.searchSection}>
                <div className={styles.searchHeader}>
                  <h1>Campus Lost and Found</h1>
                  <p>Search first, then report or message if you find a match.</p>
                </div>

                <div className={styles.searchTypeTabs}>
                  <button
                    type="button"
                    className={`${styles.searchTypeTab} ${searchType === 'lost' ? styles.activeTab : ''}`}
                    onClick={() => setSearchType('lost')}
                  >
                    Search Lost Items
                  </button>
                  <button
                    type="button"
                    className={`${styles.searchTypeTab} ${searchType === 'found' ? styles.activeTab : ''}`}
                    onClick={() => setSearchType('found')}
                  >
                    Search Found Items
                  </button>
                </div>

                <div className={styles.searchCard}>
                  <SearchBar onSearch={handleSearch} showDateFilter={false} showSort={true} defaultSort="most_recent" />
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
  );
}
            </main>
