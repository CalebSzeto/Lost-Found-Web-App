'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import { getLostItems, getFoundItems } from '@/lib/api';
import styles from './myposts.module.css';

export default function MyPostsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchMyPosts();
    }
  }, [currentUser]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const [lostRes, foundRes] = await Promise.all([
        getLostItems(),
        getFoundItems(),
      ]);
      // Filter to only user's posts
      setLostItems(lostRes.data.filter((item) => item.user_id === currentUser.uid));
      setFoundItems(foundRes.data.filter((item) => item.user_id === currentUser.uid));
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to view your posts</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  const currentItems = activeTab === 'lost' ? lostItems : foundItems;

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <h1>📋 My Posts</h1>
        <p>Manage your lost and found item reports.</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'lost' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          🔴 Lost Items ({lostItems.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'found' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('found')}
        >
          🟢 Found Items ({foundItems.length})
        </button>
      </div>

      {loading ? (
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading your posts...</p>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="emptyState">
          <h3>No {activeTab} items posted</h3>
          <p>
            {activeTab === 'lost'
              ? "You haven't reported any lost items yet."
              : "You haven't reported any found items yet."}
          </p>
          <a
            href={activeTab === 'lost' ? '/report-lost' : '/report-found'}
            className="btn btnPrimary"
          >
            Report {activeTab === 'lost' ? 'a Lost' : 'a Found'} Item
          </a>
        </div>
      ) : (
        <div className="postsGrid">
          {currentItems.map((item) => (
            <PostCard
              key={activeTab === 'lost' ? item.lost_item_id : item.found_item_id}
              post={item}
              type={activeTab}
            />
          ))}
        </div>
      )}
    </div>
  );
}
