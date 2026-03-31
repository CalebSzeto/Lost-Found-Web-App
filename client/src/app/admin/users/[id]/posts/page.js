'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminGetUserPosts } from '@/lib/api';
import styles from './posts.module.css';

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

export default function AdminUserPostsPage() {
  const { currentUser } = useAuth();
  const params = useParams();
  const userId = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : params?.id), [params]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lostPosts, setLostPosts] = useState([]);
  const [foundPosts, setFoundPosts] = useState([]);
  const [owner, setOwner] = useState(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin || !userId) {
      setLoading(false);
      return;
    }

    const loadPosts = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await adminGetUserPosts(userId);
        setOwner(res.data?.owner || null);
        setLostPosts(res.data?.lost || []);
        setFoundPosts(res.data?.found || []);
      } catch (err) {
        console.error('Error loading user posts:', err);
        setError('Failed to load user posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [isAdmin, userId]);

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to access admin tools</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Access denied</h3>
          <p>Only admin accounts can use this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>User Post History</h1>
            <p className={styles.subheading}>User ID: {userId || 'Unknown'}</p>
            {owner && (
              <p className={styles.ownerLine}>
                Owner: {owner.displayName || 'Unknown'} ({owner.email || 'No email'})
              </p>
            )}
          </div>
          <div className={styles.counts}>
            <span>{lostPosts.length} lost</span>
            <span>{foundPosts.length} found</span>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <div className={styles.emptyState}>Loading posts...</div>
        ) : (
          <div className={styles.sections}>
            <section className={styles.section}>
              <h2>Lost Posts</h2>
              {lostPosts.length === 0 ? (
                <p className={styles.emptyText}>No lost posts found.</p>
              ) : (
                <ul className={styles.postList}>
                  {lostPosts.map((post) => (
                    <li key={post.lost_item_id} className={styles.postRow}>
                      <div>
                        <p className={styles.postTitle}>{post.title}</p>
                        <p className={styles.postMeta}>
                          Status: {post.status || 'unknown'} · Created: {formatDate(post.created_at)}
                        </p>
                      </div>
                      <a
                        className={styles.openLink}
                        href={`/lost-items/${post.lost_item_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Post
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.section}>
              <h2>Found Posts</h2>
              {foundPosts.length === 0 ? (
                <p className={styles.emptyText}>No found posts found.</p>
              ) : (
                <ul className={styles.postList}>
                  {foundPosts.map((post) => (
                    <li key={post.found_item_id} className={styles.postRow}>
                      <div>
                        <p className={styles.postTitle}>{post.title || 'Found item'}</p>
                        <p className={styles.postMeta}>
                          Status: {post.status || 'unknown'} · Created: {formatDate(post.created_at)}
                        </p>
                      </div>
                      <a
                        className={styles.openLink}
                        href={`/found-items/${post.found_item_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Post
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
