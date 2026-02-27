import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createFoundItem } from '../services/api';
import './Pages.css';

const ReportFound = () => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createFoundItem({
        description,
        location,
        dropoff_time: dropoffTime,
      });
      navigate('/found-items');
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-page">
        <div className="form-card">
          <h2>🟢 Report Found Item</h2>
          <p className="form-subtitle">
            Provide a brief description to help the owner identify their item.
            <br />
            <strong>Tip:</strong> Keep details limited to prevent false claims.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
              <label htmlFor="description">Brief Description *</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the item (avoid too-specific details to prevent false claims)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location Found *</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Science Building Room 101"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dropoffTime">Planned Drop-off Time</label>
              <input
                id="dropoffTime"
                type="text"
                value={dropoffTime}
                onChange={(e) => setDropoffTime(e.target.value)}
                placeholder="e.g., Will drop off at lost & found by 5 PM today"
              />
            </div>

            <button type="submit" className="btn btn-success btn-block" disabled={loading}>
              {loading ? 'Posting...' : 'Post Found Item'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportFound;
