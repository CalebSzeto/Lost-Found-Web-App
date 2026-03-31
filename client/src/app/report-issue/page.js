'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createReport } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './report.module.css';

export default function ReportIssuePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    related_post_id: '',
    related_user_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <Navbar />
        <div className="emptyState">
          <h3>Authentication Required</h3>
          <p>Please log in or register to report issues.</p>
          <button onClick={() => router.push('/login')} className="primaryButton">
            Go to Login
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setSubmitting(true);

    try {
      await createReport({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        related_post_id: formData.related_post_id || null,
        related_user_id: formData.related_user_id || null,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/my-reports');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
      console.error('Report submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pageContainer">
      <Navbar />
      <main className={styles.container}>
        <div className={styles.formWrapper}>
          <h1>Report an Issue</h1>
          <p className={styles.description}>
            Help us maintain a safe community by reporting inappropriate content, harassment, scams, or other
            issues.
          </p>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && (
            <div className={styles.successMessage}>
              ✓ Report submitted successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="category">Report Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="other">Select a category...</option>
                <option value="inappropriate_post">Inappropriate Post</option>
                <option value="harassment">Harassment or Abuse</option>
                <option value="scam">Scam or Fraud</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="Brief summary of the issue"
                value={formData.title}
                onChange={handleChange}
                maxLength="100"
                required
              />
              <small>{formData.title.length}/100</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                placeholder="Provide detailed information about the issue..."
                value={formData.description}
                onChange={handleChange}
                maxLength="2000"
                rows={8}
                required
              />
              <small>{formData.description.length}/2000</small>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="related_post_id">Related Post ID (optional)</label>
                <input
                  id="related_post_id"
                  type="text"
                  name="related_post_id"
                  placeholder="If available"
                  value={formData.related_post_id}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="related_user_id">Related User ID (optional)</label>
                <input
                  id="related_user_id"
                  type="text"
                  name="related_user_id"
                  placeholder="If reporting a user"
                  value={formData.related_user_id}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
