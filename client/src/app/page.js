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
            <div className={styles.stepNumber}>1</div>
            <h3>Sign Up</h3>
            <p>Create an account with your school email to get started.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>2</div>
            <h3>Report</h3>
            <p>Post details about a lost or found item with location info.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>3</div>
            <h3>Connect</h3>
            <p>Browse listings and message other students to recover items.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>4</div>
            <h3>Recover</h3>
            <p>Arrange pickup and mark your item as resolved!</p>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className={styles.quickLinksSection}>
        <div className={styles.quickLinksGrid}>
          <Link href="/lost-items" className={styles.quickLinkCard}>
            <span className={styles.qlIcon}>🔍</span>
            <h3>Browse Lost Items</h3>
            <p>See what items have been reported as lost on campus.</p>
          </Link>
          <Link href="/found-items" className={styles.quickLinkCard}>
            <span className={styles.qlIcon}>📦</span>
            <h3>Browse Found Items</h3>
            <p>Check if someone has found your missing item.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
