import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFoundItem, deleteFoundItem, updateFoundItem } from '../services/api';
import './Pages.css';

const FoundItemDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    fetchItem();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteFoundItem(id);
        navigate('/found-items');
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>{error || 'Item not found'}</h3>
          <Link to="/found-items" className="btn btn-primary">Back to Found Items</Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.uid === item.user_id;

  return (
    <div className="page-container">
      <div className="detail-page">
        <Link to="/found-items" className="back-link">← Back to Found Items</Link>

        <div className="detail-card">
          <div className="detail-content">
            <div className="detail-badge-row">
              <span className="post-badge badge-found">🟢 Found Item</span>
              <span className={`status-badge status-${item.status}`}>
                {item.status}
              </span>
            </div>

            <div className="detail-meta">
              <span>📍 Found at: {item.location}</span>
              {item.dropoff_time && <span>🕐 Drop-off: {item.dropoff_time}</span>}
              <span>📅 Posted: {new Date(item.created_at).toLocaleDateString()}</span>
              <span>📧 Posted by: {item.user_email}</span>
            </div>

            <div className="detail-description">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>

            <div className="detail-actions">
              {currentUser && !isOwner && (
                <Link
                  to={`/messages?to=${item.user_id}&post=${item.found_item_id}`}
                  className="btn btn-primary"
                >
                  💬 Message Finder
                </Link>
              )}
              {isOwner && item.status === 'active' && (
                <>
                  <button onClick={handleResolve} className="btn btn-success">
                    ✅ Mark as Resolved
                  </button>
                  <button onClick={handleDelete} className="btn btn-danger">
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
};

export default FoundItemDetail;
