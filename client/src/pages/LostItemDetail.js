import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLostItem, deleteLostItem, updateLostItem } from '../services/api';
import './Pages.css';

const LostItemDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await getLostItem(id);
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
        await deleteLostItem(id);
        navigate('/lost-items');
      } catch (err) {
        setError('Failed to delete item');
      }
    }
  };

  const handleResolve = async () => {
    try {
      await updateLostItem(id, { status: 'resolved' });
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
          <Link to="/lost-items" className="btn btn-primary">Back to Lost Items</Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && currentUser.uid === item.user_id;

  return (
    <div className="page-container">
      <div className="detail-page">
        <Link to="/lost-items" className="back-link">← Back to Lost Items</Link>

        <div className="detail-card">
          {item.image_url && (
            <div className="detail-image">
              <img src={item.image_url} alt={item.title} />
            </div>
          )}

          <div className="detail-content">
            <div className="detail-badge-row">
              <span className="post-badge badge-lost">🔴 Lost Item</span>
              <span className={`status-badge status-${item.status}`}>
                {item.status}
              </span>
            </div>

            <h1>{item.title}</h1>

            <div className="detail-meta">
              <span>📍 {item.location}</span>
              <span>📅 Lost: {new Date(item.date_lost).toLocaleDateString()}</span>
              <span>🕐 Posted: {new Date(item.created_at).toLocaleDateString()}</span>
              <span>📧 Posted by: {item.user_email}</span>
            </div>

            <div className="detail-description">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>

            <div className="detail-actions">
              {currentUser && !isOwner && (
                <Link
                  to={`/messages?to=${item.user_id}&post=${item.lost_item_id}`}
                  className="btn btn-primary"
                >
                  💬 Message Owner
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

export default LostItemDetail;
