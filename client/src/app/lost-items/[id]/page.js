'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getLostItem, deleteLostItem, updateLostItem } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import styles from './detail.module.css';

export default function LostItemDetailPage() {
  const params = useParams();
  const id = params.id;
  const { currentUser } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await getLostItem(id);
        setItem(res.data);
      } catch (err) {
        setError('Item not found');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id]);

  useEffect(() => {
    setShowImage(true);
  }, [item?.image_url]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteLostItem(id);
        router.push('/lost-items');
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  const handleResolve = async () => {
    try {
      await updateLostItem(id, { status: 'resolved' });
      setItem({ ...item, status: 'resolved' });
    } catch (err) {
      setError('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="pageContainer">
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>{error || 'Item not found'}</h3>
          <Link href="/lost-items" className="btn btnPrimary">Back to Lost Items</Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.uid === item.user_id;
  const imageUrl = resolveImageUrl(item.image_url);

  return (
    <div className="pageContainer">
      <div className={styles.detailPage}>
        <Link href="/lost-items" className={styles.backLink}>← Back to Lost Items</Link>

        <div className={styles.detailCard}>
          {imageUrl && showImage && (
            <div className={styles.detailImage}>
              <img src={imageUrl} alt={item.title} onError={() => setShowImage(false)} />
            </div>
          )}

          <div className={styles.detailContent}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeLost}>🔴 Lost Item</span>
              <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                {item.status}
              </span>
            </div>

            <h1>{item.title}</h1>

            <div className={styles.meta}>
              <span>📍 {item.location}</span>
              <span>📅 Lost: {new Date(item.date_lost).toLocaleDateString()}</span>
              <span>🕐 Posted: {new Date(item.created_at).toLocaleDateString()}</span>
              <span>📧 Posted by: {item.user_email}</span>
            </div>

            <div className={styles.description}>
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>

            <div className={styles.actions}>
              {currentUser && !isOwner && (
                <Link
                  href={`/messages?to=${item.user_id}&post=${item.lost_item_id}`}
                  className="btn btnPrimary"
                >
                  💬 Message Owner
                </Link>
              )}
              {isOwner && item.status === 'active' && (
                <>
                  <button onClick={handleResolve} className="btn btnSuccess">
                    ✅ Mark as Resolved
                  </button>
                  <button onClick={handleDelete} className="btn btnDanger">
                    🗑️ Delete Post
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
