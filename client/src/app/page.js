'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/SearchBar';
import styles from './page.module.css';

export default function Home() {
  const { currentUser } = useAuth();
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

  return (
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
          <SearchBar
            onSearch={handleSearch}
            showDateFilter={false}
            showSort={true}
            defaultSort="most_recent"
          />
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
