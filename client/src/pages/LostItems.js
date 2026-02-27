import React, { useState, useEffect } from 'react';
import { getLostItems } from '../services/api';
import PostCard from '../components/Posts/PostCard';
import SearchBar from '../components/Common/SearchBar';
import './Pages.css';

const LostItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await getLostItems(filters);
      setItems(res.data);
    } catch (err) {
      setError('Failed to load lost items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSearch = (filters) => {
    fetchItems(filters);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔴 Lost Items</h1>
        <p>Browse items that have been reported as lost on campus.</p>
      </div>

      <SearchBar onSearch={handleSearch} showDateFilter={true} />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No lost items found</h3>
          <p>No items match your search criteria, or no items have been reported yet.</p>
        </div>
      ) : (
        <div className="posts-grid">
          {items.map((item) => (
            <PostCard key={item.lost_item_id} post={item} type="lost" />
          ))}
        </div>
      )}
    </div>
  );
};

export default LostItems;
