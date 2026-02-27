import React, { useState, useEffect } from 'react';
import { getFoundItems } from '../services/api';
import PostCard from '../components/Posts/PostCard';
import SearchBar from '../components/Common/SearchBar';
import './Pages.css';

const FoundItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await getFoundItems(filters);
      setItems(res.data);
    } catch (err) {
      setError('Failed to load found items');
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
        <h1>🟢 Found Items</h1>
        <p>Browse items that have been found on campus. Does one of these belong to you?</p>
      </div>

      <SearchBar onSearch={handleSearch} showDateFilter={false} />

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No found items</h3>
          <p>No items have been reported as found yet.</p>
        </div>
      ) : (
        <div className="posts-grid">
          {items.map((item) => (
            <PostCard key={item.found_item_id} post={item} type="found" />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoundItems;
