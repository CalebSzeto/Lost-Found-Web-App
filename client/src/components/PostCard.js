'use client';

import React from 'react';
import Link from 'next/link';
import styles from './PostCard.module.css';

const PostCard = ({ post, type }) => {
  if (!post) {
    return null;
  }

  const isLost = type === 'lost';

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const id = isLost ? post.lost_item_id : post.found_item_id;
  const href = isLost ? `/lost-items/${id}` : `/found-items/${id}`;

  return (
    <Link href={href} className={styles.cardLink}>
      <div className={`${styles.card} ${isLost ? styles.cardLost : styles.cardFound}`}>
        {isLost && post.image_url && (
          <div className={styles.imageWrap}>
            <img src={post.image_url} alt={post.title} className={styles.image} />
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${isLost ? styles.badgeLost : styles.badgeFound}`}>
              {isLost ? '🔴 Lost' : '🟢 Found'}
            </span>
            <span className={styles.date}>{formatDate(post.created_at)}</span>
          </div>

          {isLost && <h3 className={styles.title}>{post.title}</h3>}

          <p className={styles.description}>
            {post.description?.length > 120
              ? post.description.substring(0, 120) + '...'
              : post.description}
          </p>

          <div className={styles.meta}>
            <span>📍 {post.location}</span>
            {isLost && post.date_lost && (
              <span>📅 Lost: {formatDate(post.date_lost)}</span>
            )}
            {!isLost && post.dropoff_time && (
              <span>🕐 Drop-off: {post.dropoff_time}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
