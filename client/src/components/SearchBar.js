'use client';

import React, { useState } from 'react';
import styles from './SearchBar.module.css';

const defaultSortOptions = [
  { value: 'most_recent', label: 'Most Recent (Posted)' },
  { value: 'oldest_posted', label: 'Oldest (Posted)' },
];

const SearchBar = ({
  onSearch,
  showDateFilter = false,
  showSort = true,
  sortOptions = defaultSortOptions,
  defaultSort = 'most_recent',
}) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [sortBy, setSortBy] = useState(defaultSort);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword, location, date, sortBy });
  };

  const handleClear = () => {
    setKeyword('');
    setLocation('');
    setDate('');
    setSortBy(defaultSort);
    onSearch({ sortBy: defaultSort });
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
        {showSort && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.input}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
