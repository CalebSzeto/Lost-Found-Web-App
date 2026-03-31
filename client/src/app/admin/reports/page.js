'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminListReports, adminUpdateReport, adminRespondToReport } from '@/lib/api';
import styles from './reports.module.css';

const STATUS_COLORS = {
  open: '#e4bf5a',
  'in-progress': '#ff9800',
  resolved: '#4caf50',
  dismissed: '#999',
};

const CATEGORY_LABELS = {
  inappropriate_post: 'Inappropriate Post',
  harassment: 'Harassment',
  scam: 'Scam/Fraud',
  spam: 'Spam',
  other: 'Other',
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [respondingToId, setRespondingToId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const params = filter !== 'all' ? { status: filter } : {};
        const data = await adminListReports(params);
        setReports(data);
        setError('');
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [isAdmin, filter]);

  if (!isAdmin) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Access Denied</h3>
          <p>Only admin accounts can access this page.</p>
        </div>
      </div>
    );
  }

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setUpdatingId(reportId);
      await adminUpdateReport(reportId, { status: newStatus });
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRespond = async (reportId) => {
    if (!responseText.trim()) {
      setError('Response text is required');
      return;
    }

    try {
      setUpdatingId(reportId);
      await adminRespondToReport(reportId, responseText.trim());
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: 'in-progress' } : r))
      );
      setRespondingToId(null);
      setResponseText('');
      setError('');
    } catch (err) {
      console.error('Error responding to report:', err);
      setError('Failed to send response');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignToMe = async (reportId) => {
    try {
      setUpdatingId(reportId);
      await adminUpdateReport(reportId, { assigned_admin_id: currentUser.uid });
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, assigned_admin_id: currentUser.uid } : r))
      );
    } catch (err) {
      console.error('Error assigning report:', err);
      setError('Failed to assign report');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="pageContainer">
      <main className={styles.container}>
        <h1>Admin Reports Dashboard</h1>

        <div className={styles.controls}>
          <div className={styles.filterButtons}>
            {['open', 'in-progress', 'resolved', 'dismissed', 'all'].map((status) => (
              <button
                key={status}
                className={`${styles.filterButton} ${filter === status ? styles.active : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.stats}>
            <span>{reports.length} report(s)</span>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <div className={styles.emptyState}>
            <p>Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No reports found.</p>
          </div>
        ) : (
          <div className={styles.reportsList}>
            {reports.map((report) => (
              <div key={report._id} className={styles.reportCard}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportInfo}>
                    <h3>{report.title}</h3>
                    <div className={styles.meta}>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: STATUS_COLORS[report.status] }}
                      >
                        {report.status}
                      </span>
                      <span className={styles.categoryBadge}>{CATEGORY_LABELS[report.category]}</span>
                      <span className={styles.date}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    className={styles.toggleButton}
                    onClick={() =>
                      setExpandedReportId(expandedReportId === report._id ? null : report._id)
                    }
                  >
                    {expandedReportId === report._id ? '▼' : '▶'}
                  </button>
                </div>

                {expandedReportId === report._id && (
                  <div className={styles.reportDetails}>
                    <div className={styles.detailSection}>
                      <h4>Reporter</h4>
                      <p>{report.reporter_email}</p>
                    </div>

                    <div className={styles.detailSection}>
                      <h4>Description</h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{report.description}</p>
                    </div>

                    {report.related_post_id && (
                      <div className={styles.detailSection}>
                        <h4>Related Post ID</h4>
                        <p>{report.related_post_id}</p>
                      </div>
                    )}

                    {report.related_user_id && (
                      <div className={styles.detailSection}>
                        <h4>Related User ID</h4>
                        <p>{report.related_user_id}</p>
                      </div>
                    )}

                    {report.admin_notes && (
                      <div className={styles.detailSection}>
                        <h4>Admin Notes</h4>
                        <p>{report.admin_notes}</p>
                      </div>
                    )}

                    <div className={styles.actions}>
                      <div className={styles.statusActions}>
                        <label>Status:</label>
                        <select
                          value={report.status}
                          onChange={(e) => handleStatusChange(report._id, e.target.value)}
                          disabled={updatingId === report._id}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>

                      {report.assigned_admin_id !== currentUser.uid && (
                        <button
                          className={styles.assignButton}
                          onClick={() => handleAssignToMe(report._id)}
                          disabled={updatingId === report._id}
                        >
                          Assign to Me
                        </button>
                      )}

                      {report.assigned_admin_id === currentUser.uid && (
                        <span className={styles.assignedBadge}>Assigned to you</span>
                      )}

                      <button
                        className={styles.respondButton}
                        onClick={() =>
                          setRespondingToId(respondingToId === report._id ? null : report._id)
                        }
                      >
                        {respondingToId === report._id ? 'Cancel' : 'Send Message'}
                      </button>
                    </div>

                    {respondingToId === report._id && (
                      <div className={styles.responseForm}>
                        <textarea
                          placeholder="Type your response to send to the reporter..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          maxLength="2000"
                          rows={5}
                        />
                        <small>{responseText.length}/2000</small>
                        <div className={styles.responseButtons}>
                          <button
                            className={styles.cancelButton}
                            onClick={() => {
                              setRespondingToId(null);
                              setResponseText('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className={styles.sendButton}
                            onClick={() => handleRespond(report._id)}
                            disabled={updatingId === report._id}
                          >
                            {updatingId === report._id ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
