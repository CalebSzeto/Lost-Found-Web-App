'use client';

import React from 'react';
import Link from 'next/link';
import styles from './PostCard.module.css';
import { resolveImageUrl } from '@/lib/image';

const PostCard = ({ post, type }) => {
  if (!post) {
    return null;
  }

  const isLost = type === 'lost';
  const [showImage, setShowImage] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const id = isLost ? post.lost_item_id : post.found_item_id;
  const href = isLost ? `/lost-items/${id}` : `/found-items/${id}`;
  const imageUrl = resolveImageUrl(post.image_url);
  const displayTitle = (post.title || '').trim() || (isLost ? 'Lost item' : 'Found item');

  const handleCopyId = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(id);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = id;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy post ID:', error);
    }
  };

  React.useEffect(() => {
    setShowImage(true);
  }, [post?.image_url]);

  return (
    <Link href={href} className={styles.cardLink}>
      <div className={`${styles.card} ${isLost ? styles.cardLost : styles.cardFound}`}>
        {imageUrl && showImage ? (
          <div className={styles.imageWrap}>
            <img
              src={imageUrl}
              alt={post.title || 'Item image'}
              className={styles.image}
              onError={() => setShowImage(false)}
            />
          </div>
        ) : (
          <div className={styles.imageWrap}>
            <div className={styles.noImageBanner}>No image uploaded</div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${isLost ? styles.badgeLost : styles.badgeFound}`}>
              {isLost ? '🔴 Lost' : '🟢 Found'}
            </span>
            <span className={styles.date}>Posted: {formatDate(post.created_at)}</span>
          </div>

          <div className={styles.metaRow}>
            <span>📍 {post.location}</span>
            <span className={styles.dateInline}>
              {isLost
                ? `📅 Lost: ${post.date_lost ? formatDate(post.date_lost) : 'Unknown'}`
                : `📅 Found: ${post.date_found ? formatDate(post.date_found) : 'Unknown'}`}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.copyHint}>Post ID</span>
            <button
              type="button"
              className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
              onClick={handleCopyId}
            >
              {copied ? 'Copied' : 'Copy ID'}
            </button>
          </div>

          <h3 className={styles.title}>{displayTitle}</h3>

          <p className={styles.description}>
            {post.description?.length > 120
              ? post.description.substring(0, 120) + '...'
              : post.description}
          </p>

          <div className={styles.meta}>
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
