'use client';

import React, { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import PostCard from '@/components/PostCard';
import { getFoundItems } from '@/lib/api';
import { FaCircle } from 'react-icons/fa';

const foundSortOptions = [
  { value: 'most_recent', label: 'Most Recent (Posted)' },
  { value: 'oldest_posted', label: 'Oldest (Posted)' },
  { value: 'date_recent', label: 'Most Recently Found' },
  { value: 'date_oldest', label: 'Oldest Found Date' },
];

export default function FoundItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async (filters = {}) => {
    try {
      setLoading(true);
      const res = await getFoundItems(filters);
      setItems(res.data);
    } catch (err) {
      setError('Failed to load found items');
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
    <div className="pageContainer">
      <div className="pageHeader">
        <h1>
          <FaCircle aria-hidden="true" style={{ color: '#16a34a', marginRight: '0.5rem', verticalAlign: '-0.1em' }} />
          Found Items
        </h1>
        <p>Browse items that have been found. If one of these is yours, message the finder!</p>
      </div>

      <SearchBar
        onSearch={handleSearch}
        showDateFilter={false}
        showSort={true}
        sortOptions={foundSortOptions}
        defaultSort="most_recent"
      />

      {loading ? (
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading found items...</p>
        </div>
      ) : error ? (
        <div className="errorMessage">{error}</div>
      ) : items.length === 0 ? (
        <div className="emptyState">
          <h3>No found items posted yet</h3>
          <p>Check back later or report an item you&apos;ve found.</p>
        </div>
      ) : (
        <div className="postsGrid">
          {items.map((item) => (
            <PostCard key={item.found_item_id} post={item} type="found" />
          ))}
        </div>
      )}
    </div>
  );
}
