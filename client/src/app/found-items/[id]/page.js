'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getFoundItem, deleteFoundItem, updateFoundItem } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import { normalizeImageFile, prepareImageForUpload } from '@/lib/imageOptimization';
import styles from './detail.module.css';

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

export default function FoundItemDetailPage() {
  const params = useParams();
  const id = params.id;
  const { currentUser } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImage, setShowImage] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    location: '',
    date_found: '',
    dropoff_time: '',
  });
  const [editImage, setEditImage] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editImageError, setEditImageError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await getFoundItem(id);
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
    if (item) {
      setEditData({
        title: item.title || '',
        description: item.description || '',
        location: item.location || '',
        date_found: item.date_found ? item.date_found.split('T')[0] : '',
        dropoff_time: item.dropoff_time || '',
      });
      setEditImage(null);
      setEditPreview(item.image_url ? resolveImageUrl(item.image_url) : null);
      setRemoveImage(false);
    }
  }, [item]);

  useEffect(() => {
    setShowImage(true);
  }, [item?.image_url]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteFoundItem(id);
        router.push('/found-items');
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  const handleResolve = async () => {
    try {
      await updateFoundItem(id, { status: 'resolved' });
      setItem({ ...item, status: 'resolved' });
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const normalized = await normalizeImageFile(file);
      if (normalized.size > MAX_IMAGE_SIZE_BYTES) {
        setEditImageError('Image must be 4MB or smaller');
        setError('Image must be 4MB or smaller');
        return;
      }

      setEditImageError('');
      setError('');
      setRemoveImage(false);
      setEditImage(normalized);
      const reader = new FileReader();
      reader.onloadend = () => setEditPreview(reader.result);
      reader.readAsDataURL(normalized);
    } catch (err) {
      setEditImageError('Unsupported image type. Use JPG, PNG, or WEBP.');
      setError('Unsupported image type. Use JPG, PNG, or WEBP.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.description || !editData.location || !editData.date_found) {
      setError('Please fill in all required fields');
      return;
    }

    if (editImageError) {
      return;
    }

    try {
      const data = new FormData();
      data.append('title', editData.title);
      data.append('description', editData.description);
      data.append('location', editData.location);
      data.append('date_found', editData.date_found);
      data.append('dropoff_time', editData.dropoff_time);

      if (removeImage) {
        data.append('remove_image', 'true');
      }

      if (editImage) {
        const uploadableImage = await prepareImageForUpload(editImage, MAX_IMAGE_SIZE_BYTES);
        data.append('image', uploadableImage);
      }

      const res = await updateFoundItem(id, data);
      setItem(res.data.item || { ...item, ...editData });
      setIsEditing(false);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update post');
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

  if (!item) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>{error || 'Item not found'}</h3>
          <Link href="/found-items" className="btn btnPrimary">Back to Found Items</Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.uid === item.user_id;
  const imageUrl = resolveImageUrl(item.image_url);
  const postId = item.found_item_id;

  const handleCopyId = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(postId);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = postId;
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

  return (
    <div className="pageContainer">
      <div className={styles.detailPage}>
        <Link href="/found-items" className={styles.backLink}>← Back to Found Items</Link>

        {error && <div className="errorMessage">{error}</div>}
        <div className={styles.detailCard}>
          {imageUrl && showImage && (
            <div className={styles.detailImage}>
              <img src={imageUrl} alt={item.title} onError={() => setShowImage(false)} />
            </div>
          )}

          <div className={styles.detailContent}>
            <div className={styles.badgeRow}>
              <div className={styles.badgeGroup}>
                <span className={styles.badgeFound}>🟢 Found Item</span>
                <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                  {item.status}
                </span>
              </div>
              <div className={styles.postIdWrap}>
                <span className={styles.postIdLabel}>Post ID: {postId}</span>
                <button
                  type="button"
                  className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                  onClick={handleCopyId}
                >
                  {copied ? 'Copied' : 'Copy ID'}
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className={styles.editForm}>
                <div className={styles.editRow}>
                  <label htmlFor="title">Title</label>
                  <input
                    id="title"
                    name="title"
                    value={editData.title}
                    onChange={handleEditChange}
                  />
                </div>
                <div className={styles.editRow}>
                  <label htmlFor="location">Location *</label>
                  <input
                    id="location"
                    name="location"
                    value={editData.location}
                    onChange={handleEditChange}
                  />
                </div>
                <div className={styles.editRow}>
                  <label htmlFor="date_found">Date Found *</label>
                  <input
                    id="date_found"
                    type="date"
                    name="date_found"
                    value={editData.date_found}
                    onChange={handleEditChange}
                  />
                </div>
                <div className={styles.editRow}>
                  <label htmlFor="dropoff_time">Drop-off Time</label>
                  <input
                    id="dropoff_time"
                    name="dropoff_time"
                    value={editData.dropoff_time}
                    onChange={handleEditChange}
                  />
                </div>
                <div className={styles.editRow}>
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={editData.description}
                    onChange={handleEditChange}
                  />
                </div>
                <div className={styles.editRow}>
                  <label htmlFor="edit_image">Item Image</label>
                  <input
                    id="edit_image"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                  />
                  <p className={styles.uploadHint}>Supported types: JPG, PNG, WEBP.</p>
                  {editImageError && <p className={styles.uploadError}>{editImageError}</p>}
                  {editPreview && !removeImage && (
                    <div className={styles.editPreviewFrame}>
                      <img src={editPreview} alt="Preview" />
                    </div>
                  )}
                  {item.image_url && (
                    <button
                      type="button"
                      className={styles.removeImage}
                      onClick={() => {
                        setRemoveImage(true);
                        setEditImage(null);
                        setEditPreview(null);
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
                <div className={styles.editActions}>
                  <button type="button" className="btn" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btnPrimary" onClick={handleSaveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1>{item.title}</h1>

            <div className={styles.meta}>
              <span>📍 {item.location}</span>
              <span>📅 Found: {new Date(item.date_found).toLocaleDateString()}</span>
              <span>🕐 Posted: {new Date(item.created_at).toLocaleDateString()}</span>
              <span>📧 Posted by: {item.user_email}</span>
            </div>

                <div className={styles.description}>
                  <h3>Description</h3>
                  <p>{item.description}</p>
                </div>
              </>
            )}

            <div className={styles.actions}>
              {currentUser && !isOwner && (
                <Link
                  href={`/messages?to=${item.user_id}&post=${item.found_item_id}`}
                  className="btn btnPrimary"
                >
                  💬 Message Finder
                </Link>
              )}
              {isOwner && item.status === 'active' && (
                <>
                  {!isEditing && (
                    <button type="button" onClick={() => setIsEditing(true)} className="btn">
                      ✏️ Edit Post
                    </button>
                  )}
                  <button onClick={handleResolve} className="btn btnSuccess">
                    ✅ Mark as Returned
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
