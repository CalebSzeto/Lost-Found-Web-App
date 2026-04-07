import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div>
          <p className={styles.brand}>Reunite</p>
          <p className={styles.subtitle}>Campus lost-and-found, designed for faster recovery.</p>
        </div>
        <p className={styles.copyright}>© {new Date().getFullYear()} Reunite</p>
      </div>
    </footer>
  );
};

export default Footer;
