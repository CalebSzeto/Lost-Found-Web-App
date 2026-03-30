'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  adminDeleteUser,
  adminForceLogout,
  adminForcePasswordReset,
  adminListUsers,
  adminSetUserStatus,
} from '@/lib/api';
import styles from './admin.module.css';

const STATUS_OPTIONS = ['active', 'restricted', 'banned'];

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyUserId, setBusyUserId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [reasonDrafts, setReasonDrafts] = useState({});
  const [banExpiryDrafts, setBanExpiryDrafts] = useState({});

  const isAdmin = currentUser?.role === 'admin';

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return a.email.localeCompare(b.email);
    });
  }, [users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminListUsers();
      const list = res.data || [];
      setUsers(list);

      const statusMap = {};
      const reasonMap = {};
      const banExpiryMap = {};
      list.forEach((u) => {
        statusMap[u.user_id] = u.account_status || 'active';
        reasonMap[u.user_id] = '';
        banExpiryMap[u.user_id] = u.ban_expires_at || '';
      });
      setStatusDrafts(statusMap);
      setReasonDrafts(reasonMap);
      setBanExpiryDrafts(banExpiryMap);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const setStatus = async (user) => {
    const nextStatus = statusDrafts[user.user_id] || user.account_status || 'active';
    const reason = reasonDrafts[user.user_id] || '';
    const banExpiry = banExpiryDrafts[user.user_id] || null;

    if ((nextStatus === 'restricted' || nextStatus === 'banned') && !reason.trim()) {
      setError('Reason is required for restricted or banned status');
      return;
    }

    try {
      setBusyUserId(user.user_id);
      await adminSetUserStatus(user.user_id, {
        account_status: nextStatus,
        reason: reason.trim() || undefined,
        ban_expires_at: nextStatus === 'banned' ? banExpiry || null : null,
      });
      setSuccess(`Updated ${user.email} to ${nextStatus}`);
      setError('');
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update user status');
    } finally {
      setBusyUserId(null);
    }
  };

  const runAction = async (user, action) => {
    try {
      setBusyUserId(user.user_id);
      if (action === 'force-logout') {
        await adminForceLogout(user.user_id, 'Administrative session reset');
        setSuccess(`Forced logout for ${user.email}`);
      }
      if (action === 'force-password-reset') {
        await adminForcePasswordReset(user.user_id, 'Administrative password reset required');
        setSuccess(`Password reset required set for ${user.email}`);
      }
      if (action === 'delete') {
        const reason = reasonDrafts[user.user_id] || '';
        if (!reason.trim()) {
          setError('Deletion requires a reason');
          return;
        }
        const confirmed = window.confirm(
          `Delete ${user.email} and all related data? This cannot be undone.`
        );
        if (!confirmed) return;

        await adminDeleteUser(user.user_id, reason.trim());
        setSuccess(`Deleted ${user.email}`);
      }

      setError('');
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Admin action failed');
    } finally {
      setBusyUserId(null);
    }
  };

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
      <div className={styles.adminPage}>
        <div className={styles.headerRow}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage users, account status, and safety actions.</p>
          </div>
          <button type="button" className="btn btnPrimary" onClick={loadUsers} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && <div className="errorMessage">{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {loading ? (
          <div className="loadingSpinner">
            <div className="spinner"></div>
            <p>Loading admin data...</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Ban Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => {
                  const isBusy = busyUserId === user.user_id;
                  const isAdminUser = user.role === 'admin';

                  return (
                    <tr key={user.user_id}>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <select
                          value={statusDrafts[user.user_id] || 'active'}
                          onChange={(e) =>
                            setStatusDrafts((prev) => ({ ...prev, [user.user_id]: e.target.value }))
                          }
                          disabled={isBusy || isAdminUser}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Required for restriction/ban/delete"
                          value={reasonDrafts[user.user_id] || ''}
                          onChange={(e) =>
                            setReasonDrafts((prev) => ({ ...prev, [user.user_id]: e.target.value }))
                          }
                          disabled={isBusy || isAdminUser}
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          value={banExpiryDrafts[user.user_id] || ''}
                          onChange={(e) =>
                            setBanExpiryDrafts((prev) => ({ ...prev, [user.user_id]: e.target.value }))
                          }
                          disabled={
                            isBusy ||
                            isAdminUser ||
                            (statusDrafts[user.user_id] || 'active') !== 'banned'
                          }
                        />
                      </td>
                      <td>
                        <div className={styles.actionGrid}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => setStatus(user)}
                            disabled={isBusy || isAdminUser}
                          >
                            Save Status
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => runAction(user, 'force-logout')}
                            disabled={isBusy || isAdminUser}
                          >
                            Force Logout
                          </button>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => runAction(user, 'force-password-reset')}
                            disabled={isBusy}
                          >
                            Force Reset
                          </button>
                          <button
                            type="button"
                            className="btn btnDanger"
                            onClick={() => runAction(user, 'delete')}
                            disabled={isBusy || isAdminUser}
                          >
                            Delete User
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
