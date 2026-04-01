'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  adminListReports,
  adminUpdateReport,
  adminRespondToReport,
  getFoundItem,
  getLostItem,
} from '@/lib/api';
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
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [expandedReportIds, setExpandedReportIds] = useState([]);
  const [respondingToId, setRespondingToId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [openingReportId, setOpeningReportId] = useState(null);
  const [openingOwnerReportId, setOpeningOwnerReportId] = useState(null);
  const [openingReporterReportId, setOpeningReporterReportId] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const fetchReports = useCallback(
    async (options = { showLoading: true }) => {
      if (!isAdmin) return;

      try {
        if (options.showLoading) {
          setLoading(true);
        }
        const params = filter !== 'all' ? { status: filter } : {};
        const res = await adminListReports(params);
        setReports(res.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports');
      } finally {
        if (options.showLoading) {
          setLoading(false);
        }
      }
    },
    [isAdmin, filter]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
      fetchReports({ showLoading: false });
    }
  };

  const handleRespond = async (reportId) => {
    if (!responseText.trim()) {
      setError('Response text is required');
      return;
    }

    try {
      const responseAt = new Date().toISOString();
      const responseEntry = {
        text: responseText.trim(),
        at: responseAt,
        by: currentUser.uid,
        by_email: currentUser.email,
      };
      setUpdatingId(reportId);
      await adminRespondToReport(reportId, responseText.trim());
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId
            ? {
                ...r,
                status: 'in-progress',
                last_response_at: responseAt,
                last_response_by: currentUser.uid,
                last_response_text: responseText.trim(),
                response_history: [...(r.response_history || []), responseEntry],
              }
            : r
        )
      );
      setRespondingToId(null);
      setResponseText('');
      setError('');
    } catch (err) {
      console.error('Error responding to report:', err);
      setError('Failed to send response');
    } finally {
      setUpdatingId(null);
      fetchReports({ showLoading: false });
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
      fetchReports({ showLoading: false });
    }
  };

  const handleUnassign = async (reportId) => {
    try {
      setUpdatingId(reportId);
      await adminUpdateReport(reportId, { assigned_admin_id: null });
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, assigned_admin_id: null } : r))
      );
    } catch (err) {
      console.error('Error unassigning report:', err);
      setError('Failed to unassign report');
    } finally {
      setUpdatingId(null);
      fetchReports({ showLoading: false });
    }
  };

  const handleToggleReport = (reportId) => {
    setExpandedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const handleOpenRelatedPost = async (report) => {
    if (!report?.related_post_id) {
      return;
    }

    setOpeningReportId(report._id);
    setError('');

    try {
      await getLostItem(report.related_post_id);
      setOpeningReportId(null);
      window.open(`/lost-items/${report.related_post_id}`, '_blank', 'noopener,noreferrer');
      return;
    } catch (err) {
      if (err?.response?.status && err.response.status !== 404) {
        console.error('Error checking lost post:', err);
        setError('Failed to load related post');
        setOpeningReportId(null);
        return;
      }
    }

    try {
      await getFoundItem(report.related_post_id);
      window.open(`/found-items/${report.related_post_id}`, '_blank', 'noopener,noreferrer');
      return;
    } catch (err) {
      if (err?.response?.status && err.response.status !== 404) {
        console.error('Error checking found post:', err);
        setError('Failed to load related post');
      } else {
        setError('Related post not found');
      }
    } finally {
      setOpeningReportId(null);
    }
  };

  const handleOpenOwnerPosts = async (report) => {
    if (!report?.related_post_id) {
      return;
    }

    setOpeningOwnerReportId(report._id);
    setError('');

    try {
      const res = await getLostItem(report.related_post_id);
      const ownerId = res?.data?.user_id;
      if (ownerId) {
        window.open(`/admin/users/${ownerId}/posts`, '_blank', 'noopener,noreferrer');
        setOpeningOwnerReportId(null);
        return;
      }
    } catch (err) {
      if (err?.response?.status && err.response.status !== 404) {
        console.error('Error checking lost post owner:', err);
        setError('Failed to load post owner');
        setOpeningOwnerReportId(null);
        return;
      }
    }

    try {
      const res = await getFoundItem(report.related_post_id);
      const ownerId = res?.data?.user_id;
      if (ownerId) {
        window.open(`/admin/users/${ownerId}/posts`, '_blank', 'noopener,noreferrer');
        setOpeningOwnerReportId(null);
        return;
      }
      setError('Post owner not found');
    } catch (err) {
      if (err?.response?.status && err.response.status !== 404) {
        console.error('Error checking found post owner:', err);
        setError('Failed to load post owner');
      } else {
        setError('Post owner not found');
      }
    } finally {
      setOpeningOwnerReportId(null);
    }
  };

  const handleOpenReporterPosts = (report) => {
    if (!report?.reporter_id) {
      return;
    }

    setOpeningReporterReportId(report._id);
    setError('');
    window.open(`/admin/users/${report.reporter_id}/posts`, '_blank', 'noopener,noreferrer');
    setOpeningReporterReportId(null);
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
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => fetchReports()}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
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
                <div
                  className={styles.reportHeader}
                  onClick={() => handleToggleReport(report._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleReport(report._id);
                    }
                  }}
                >
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
                      {report.last_response_at && (
                        <span className={styles.respondedBadge}>Responded</span>
                      )}
                      <span className={styles.date}>
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className={styles.chevron}>
                    {expandedReportIds.includes(report._id) ? '▼' : '▶'}
                  </span>
                </div>

                {expandedReportIds.includes(report._id) && (
                  <div className={styles.reportDetails}>
                    <div className={styles.detailSection}>
                      <h4>Reporter</h4>
                      <div className={styles.relatedPostRow}>
                        <p>{report.reporter_email}</p>
                        <button
                          type="button"
                          className={styles.secondaryLinkButton}
                          onClick={() => handleOpenReporterPosts(report)}
                          disabled={openingReporterReportId === report._id}
                        >
                          {openingReporterReportId === report._id ? 'Opening...' : 'Reporter Posts'}
                        </button>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      <h4>Description</h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{report.description}</p>
                    </div>

                    {report.related_post_id && (
                      <div className={styles.detailSection}>
                        <h4>Related Post ID</h4>
                        <div className={styles.relatedPostRow}>
                          <p>{report.related_post_id}</p>
                          <div className={styles.relatedPostActions}>
                            <button
                              type="button"
                              className={styles.linkButton}
                              onClick={() => handleOpenRelatedPost(report)}
                              disabled={openingReportId === report._id}
                            >
                              {openingReportId === report._id ? 'Opening...' : 'Open Post'}
                            </button>
                            <button
                              type="button"
                              className={styles.secondaryLinkButton}
                              onClick={() => handleOpenOwnerPosts(report)}
                              disabled={openingOwnerReportId === report._id}
                            >
                              {openingOwnerReportId === report._id ? 'Opening...' : 'Owner Posts'}
                            </button>
                          </div>
                        </div>
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

                    <div className={styles.detailSection}>
                      <h4>Admin Responses</h4>
                      {report.response_history && report.response_history.length > 0 ? (
                        <div className={styles.responseList}>
                          {report.response_history
                            .slice()
                            .reverse()
                            .map((entry, index) => (
                              <div key={`${entry.at}-${index}`} className={styles.responseItem}>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                                <p className={styles.responseMeta}>
                                  Sent: {entry.at ? new Date(entry.at).toLocaleString() : 'Unknown'}
                                  {entry.by_email ? ` · ${entry.by_email}` : ''}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className={styles.responseMeta}>No response sent yet.</p>
                      )}
                    </div>

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
                        <>
                          <span className={styles.assignedBadge}>Assigned to you</span>
                          <button
                            className={styles.unassignButton}
                            onClick={() => handleUnassign(report._id)}
                            disabled={updatingId === report._id}
                          >
                            Unassign
                          </button>
                        </>
                      )}

                      <button
                        className={styles.respondButton}
                        onClick={() =>
                          setRespondingToId(respondingToId === report._id ? null : report._id)
                        }
                      >
                        {respondingToId === report._id ? 'Cancel' : 'Respond'}
                      </button>
                    </div>

                    {respondingToId === report._id && (
                      <div className={styles.responseForm}>
                        <textarea
                          placeholder="Type your response for this report..."
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
