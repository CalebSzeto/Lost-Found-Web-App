'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMyReports } from '@/lib/api';
import styles from './myreports.module.css';

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

function normalizeResponses(report) {
  const history = Array.isArray(report.response_history) ? report.response_history : [];
  if (history.length > 0) {
    return history;
  }

  if (report.last_response_text) {
    return [
      {
        text: report.last_response_text,
        at: report.last_response_at || null,
        by_email: null,
      },
    ];
  }

  return [];
}

function getLastResponseTimestamp(report) {
  const history = Array.isArray(report.response_history) ? report.response_history : [];
  if (history.length > 0) {
    return history.reduce((latest, entry) => {
      const value = entry?.at ? new Date(entry.at).getTime() : 0;
      return value > latest ? value : latest;
    }, 0);
  }

  return report.last_response_at ? new Date(report.last_response_at).getTime() : 0;
}

function getLastSeenMap(userId) {
  if (!userId || typeof window === 'undefined') return {};
  const key = `reports:lastSeenMap:${userId}`;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    return {};
  }
}

function setLastSeenMap(userId, map) {
  if (!userId || typeof window === 'undefined') return;
  const key = `reports:lastSeenMap:${userId}`;
  localStorage.setItem(key, JSON.stringify(map));
}

export default function MyReportsPage() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);
  const [lastSeenMap, setLastSeenMapState] = useState({});

  const sortedReports = useMemo(() =>
    [...reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  [reports]);

  useEffect(() => {
    if (!currentUser) {
      setLastSeenMapState({});
      return;
    }
    setLastSeenMapState(getLastSeenMap(currentUser.uid));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadReports = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getMyReports();
          const nextReports = res.data || [];
          setReports(nextReports);
          const validIds = new Set(
            nextReports.map((report) => report._id || report.report_id).filter(Boolean)
          );
          setExpandedIds((prev) => prev.filter((id) => validIds.has(id)));
      } catch (err) {
        console.error('Failed to load reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [currentUser]);

  const toggleReport = (reportId) => {
    setExpandedIds((prev) => {
      const isOpen = prev.includes(reportId);
      if (!isOpen && currentUser) {
        const updated = {
          ...lastSeenMap,
          [reportId]: new Date().toISOString(),
        };
        setLastSeenMapState(updated);
        setLastSeenMap(currentUser.uid, updated);
      }
      return isOpen ? prev.filter((id) => id !== reportId) : [...prev, reportId];
    });
  };

  if (!currentUser) {
    return (
      <div className="pageContainer">
        <div className="emptyState">
          <h3>Please log in to view your reports</h3>
          <a href="/login" className="btn btnPrimary">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="pageContainer">
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>My Reports</h1>
            <p className={styles.subheading}>Track responses from the admin team.</p>
          </div>
          <Link href="/messages" className={styles.messagesLink}>
            Open Messages
          </Link>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <div className={styles.emptyState}>Loading reports...</div>
        ) : sortedReports.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No reports yet</h3>
            <p>You have not submitted any reports.</p>
            <Link href="/report-issue" className={styles.primaryButton}>
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className={styles.reportsList}>
            {sortedReports.map((report) => {
              const responses = normalizeResponses(report);
              const reportKey = report._id || report.report_id;
              const isOpen = reportKey ? expandedIds.includes(reportKey) : false;
              const lastResponse = getLastResponseTimestamp(report);
              const lastSeen = reportKey && lastSeenMap[reportKey]
                ? new Date(lastSeenMap[reportKey]).getTime()
                : 0;
              const hasNewResponse = lastResponse > lastSeen;
              return (
                <div key={report._id} className={styles.reportCard}>
                  <div
                    className={styles.reportHeader}
                    onClick={() => reportKey && toggleReport(reportKey)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (reportKey) {
                          toggleReport(reportKey);
                        }
                      }
                    }}
                  >
                    <div>
                      <h3>{report.title}</h3>
                      <div className={styles.meta}>
                        <span
                          className={styles.statusBadge}
                          style={{ backgroundColor: STATUS_COLORS[report.status] }}
                        >
                          {report.status}
                        </span>
                        {hasNewResponse && (
                          <span className={styles.newBadge}>New Response</span>
                        )}
                        <span className={styles.categoryBadge}>
                          {CATEGORY_LABELS[report.category] || 'Other'}
                        </span>
                        <span className={styles.date}>
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={styles.chevron}>{isOpen ? '▼' : '▶'}</span>
                  </div>

                  {isOpen && (
                    <div className={styles.reportDetails}>
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

                      <div className={styles.detailSection}>
                        <h4>Admin Responses</h4>
                        {responses.length > 0 ? (
                          <div className={styles.responseList}>
                            {responses
                              .slice()
                              .reverse()
                              .map((entry, index) => (
                                <div key={`${entry.at}-${index}`} className={styles.responseItem}>
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                                  {entry.at && (
                                    <p className={styles.responseMeta}>
                                      Sent: {new Date(entry.at).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className={styles.responseMeta}>No response yet. Check Messages for replies.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
