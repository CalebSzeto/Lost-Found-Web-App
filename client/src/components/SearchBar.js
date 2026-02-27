'use client';

import React, { useState } from 'react';
import styles from './SearchBar.module.css';

const SearchBar = ({ onSearch, showDateFilter = true }) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword, location, date });
  };

  const handleClear = () => {
    setKeyword('');
    setLocation('');
    setDate('');
    onSearch({});
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <input
          type="text"
          placeholder="Search by keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={styles.input}
        />
        {showDateFilter && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles.input}
          />
        )}
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.btnSearch}>Search</button>
        <button type="button" onClick={handleClear} className={styles.btnClear}>Clear</button>
      </div>
    </form>
  );
};

export default SearchBar;
