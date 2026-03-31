'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createFoundItem } from '@/lib/api';
import { normalizeImageFile, prepareImageForUpload } from '@/lib/imageOptimization';
import styles from './report.module.css';

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_SIZE_MB = Math.floor(MAX_IMAGE_SIZE_BYTES / (1024 * 1024));

function getSubmitErrorMessage(err) {
  const status = err?.response?.status;
  const serverError = err?.response?.data?.error;

  if (status === 401) {
    return 'Your session expired. Please log in again.';
  }
  if (status === 413) {
    return 'Image is too large even after optimization. Try a smaller image.';
  }
  if (status >= 500) {
    return serverError || 'Server error while creating post. Please try again.';
  }
  if (status >= 400) {
    return serverError || 'Invalid post data. Please review your input.';
  }

  if (err?.message?.toLowerCase().includes('too large')) {
    return 'Image is too large even after optimization. Try a smaller image.';
  }
  if (err?.message === 'Network Error') {
    return 'Cannot reach the server. Check your connection and try again.';
  }

  return serverError || err?.message || 'Failed to create post';
}

export default function ReportFoundPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date_found: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to report a found item</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const normalized = await normalizeImageFile(file);
        if (normalized.size > MAX_IMAGE_SIZE_BYTES) {
          setImageError(`Image exceeds ${MAX_IMAGE_SIZE_MB}MB limit. Please choose a smaller image.`);
          setError('');
          return;
        }

        setImageError('');
        setError('');
        setImage(normalized);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(normalized);
      } catch (err) {
        setImageError('Unsupported image type. Use JPG, PNG, WEBP, or HEIC.');
        setError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (imageError) {
      setError(imageError);
      return;
    }

    if (!formData.title || !formData.description || !formData.location || !formData.date_found) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('location', formData.location);
      data.append('date_found', formData.date_found);
      if (image) {
        const uploadableImage = await prepareImageForUpload(image, MAX_IMAGE_SIZE_BYTES);
        data.append('image', uploadableImage);
      }
      await createFoundItem(data);
      router.push('/found-items');
    } catch (err) {
      setError(getSubmitErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pageContainer">
      <div className={styles.reportPage}>
        <div className={styles.reportHeader}>
          <h1>🟢 Report a Found Item</h1>
          <p>Help reunite this item with its owner by providing details.</p>
        </div>

        {error && <div className="errorMessage">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <div className="formGroup">
            <label htmlFor="title">Item Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Black iPhone Charger"
            {imageError && <p className={styles.uploadError}>{imageError}</p>}
            {imagePreview && (
            />
          </div>

          <div className="formGroup">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the item — color, brand, condition, where exactly you found it..."
              rows="5"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className="formGroup">
              <label htmlFor="location">Location Found *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Student Union Room 204"
                required
              />
            </div>

            <div className="formGroup">
              <label htmlFor="date_found">Date Found *</label>
              <input
                type="date"
                id="date_found"
                name="date_found"
                value={formData.date_found}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="formGroup">
            <label htmlFor="image">Upload Image (optional)</label>
            <p className={styles.uploadHint}>
              Supported types: JPG, PNG, WEBP, HEIC. Maximum file size: {MAX_IMAGE_SIZE_MB}MB
            </p>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
            {imageError && <p className={styles.uploadHint}>{imageError}</p>}
            {imagePreview && (
              <div className={styles.imagePreview}>
                <div className={styles.imagePreviewFrame}>
                  <img src={imagePreview} alt="Preview" />
                </div>
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className={styles.removeImage}
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btnSuccess" disabled={loading}>
            {loading ? 'Submitting...' : '📤 Submit Found Item Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
