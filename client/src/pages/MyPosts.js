import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLostItems, getFoundItems, deleteLostItem, deleteFoundItem } from '../services/api';
import PostCard from '../components/Posts/PostCard';
import './Pages.css';

const MyPosts = () => {
  const { currentUser } = useAuth();
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const [lostRes, foundRes] = await Promise.all([
        getLostItems(),
        getFoundItems(),
      ]);

      // Filter to only user's posts
      setLostItems(lostRes.data.filter((item) => item.user_id === currentUser.uid));
      setFoundItems(foundRes.data.filter((item) => item.user_id === currentUser.uid));
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Please log in to view your posts</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📝 My Posts</h1>
        <p>Manage your lost and found item posts.</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'lost' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          Lost Items ({lostItems.length})
        </button>
        <button
          className={`tab ${activeTab === 'found' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('found')}
        >
          Found Items ({foundItems.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your posts...</p>
        </div>
      ) : (
        <div className="posts-grid">
          {activeTab === 'lost' ? (
            lostItems.length === 0 ? (
              <div className="empty-state">
                <h3>No lost item posts</h3>
                <p>You haven't reported any lost items yet.</p>
              </div>
            ) : (
              lostItems.map((item) => (
                <PostCard key={item.lost_item_id} post={item} type="lost" />
              ))
            )
          ) : (
            foundItems.length === 0 ? (
              <div className="empty-state">
                <h3>No found item posts</h3>
                <p>You haven't reported any found items yet.</p>
              </div>
            ) : (
              foundItems.map((item) => (
                <PostCard key={item.found_item_id} post={item} type="found" />
              ))
            )
          )}
        </div>
      )}
    </div>
  );
};

export default MyPosts;
