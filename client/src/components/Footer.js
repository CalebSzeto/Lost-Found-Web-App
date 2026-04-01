import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>© {new Date().getFullYear()} Reunite. All rights reserved.</p>
        <p className={styles.subtitle}>Helping students recover their belongings.</p>
      </div>
    </footer>
  );
};

export default Footer;
