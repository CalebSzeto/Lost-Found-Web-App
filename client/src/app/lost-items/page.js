'use client';

import React, { useState, useEffect } from 'react';
import { getLostItems } from '@/lib/api';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';
import { FaCircle, FaListAlt } from 'react-icons/fa';

const lostSortOptions = [
  { value: 'most_recent', label: 'Most Recent (Posted)' },
  { value: 'oldest_posted', label: 'Oldest (Posted)' },
  { value: 'date_recent', label: 'Most Recently Lost' },
  { value: 'date_oldest', label: 'Oldest Lost Date' },
];

export default function LostItemsPage() {
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

  return (
    <div className="pageContainer">
      <div className="pageHeader">
        <h1>
          <FaCircle aria-hidden="true" style={{ color: '#dc2626', marginRight: '0.5rem', verticalAlign: '-0.1em' }} />
          Lost Items
        </h1>
        <p>Browse items that have been reported as lost on campus.</p>
      </div>

      <SearchBar
        onSearch={fetchItems}
        showDateFilter={false}
        showSort={true}
        sortOptions={lostSortOptions}
        defaultSort="most_recent"
      />

      {error && <div className="errorMessage">{error}</div>}

      {loading ? (
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="emptyState">
          <span className="emptyIcon"><FaListAlt aria-hidden="true" /></span>
          <h3>No lost items found</h3>
          <p>No items match your search criteria, or no items have been reported yet.</p>
        </div>
      ) : (
        <div className="postsGrid">
          {items.map((item) => (
            <PostCard key={item.lost_item_id} post={item} type="lost" />
          ))}
        </div>
      )}
    </div>
  );
}
