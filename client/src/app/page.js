'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const AUTH_NOTICE_KEY = 'reunite.authNotice';
const AUTH_NOTICE_EVENT = 'auth:logout-notice';

const browsingPreviewCards = [
  { id: 'A01', title: 'Blue Hydro Flask', subtitle: 'Missing Blue Hydro Flask', tint: '#4a8fd8' },
  { id: 'A02', title: 'Neon Green Hydro Flask', subtitle: 'Missing Neon Green Hydro Flask', tint: '#42ca4e' },
  { id: 'A03', title: 'Gray Hydro Flask', subtitle: 'Missing Gray Hydro Flask', tint: '#7d8790' },
  { id: 'A04', title: 'Yellow Hydro Flask', subtitle: 'Missing Yellow Hydro Flask', tint: '#e0bc1f' },
  { id: 'A05', title: 'Pink Hydro Flask', subtitle: 'Missing Pink Hydro Flask', tint: '#cf67aa' },
  { id: 'A06', title: 'Red Hydro Flask', subtitle: 'Missing Red Hydro Flask', tint: '#d43636' },
];

const featurePages = [
  {
    label: '01',
    title: 'Browsing and Posting',
    body:
      'Find and share items easily without making the process complicated.',
    bullets: [
      'Browse Lost Items and Found Items pages to check current reports.',
      'Use the filters (keyword, location, date, sort) to narrow results.',
      'Click Search to apply keyword or location filters, and Clear to reset filters.',
      'Report Lost and Report Found pages let you publish a new post with details and images.',
      'Include title, location, date, and unique identifiers to improve match quality.',
    ],
    ctaLabel: 'Browse Lost Items',
    ctaHref: '/lost-items',
    mediaTone: 'search',
  },
  {
    label: '02',
    title: 'How to Message Post Owners',
    body:
      'Connect with the right person without making the experience feel heavy or technical.',
    bullets: [
        'Open the post details page for the item you think is relevant.',
        'Use the message action on that post to start a conversation.',
        'Explain why you believe it is a match and share verification details.',
        'Check the Messages page and navbar unread badge for replies.',
      ],
    ctaLabel: 'Open Messages',
    ctaHref: '/messages',
    mediaTone: 'chat',
  },
  {
    label: '03',
    title: 'Report to Admin',
    body:
      'If you see abuse, spam, or suspicious activity, report it to admin immediately.',
    bullets: [
      'Reports require a Related Post ID. Click Copy ID on the post card, then paste it into the report.',
      'Include a short reason in the description so admins can act quickly.',
      'Admins can moderate accounts, posts, and messages from the Admin Dashboard.',
      'For urgent issues, report first and avoid direct confrontation in chat.',
    ],
    ctaLabel: 'Report Issue',
    ctaHref: '/report-issue',
    mediaTone: 'shield',
  },
  {
    label: '04',
    title: 'Profile and Tools',
    body:
      'Your personal command center keeps the recovery journey organized and calm.',
    bullets: [
      'Account Info shows your role and account status.',
      'Reset Password updates credentials for account security.',
      'Unblock List lets you reverse accidental blocks.',
      'My Posts lets you edit your own posts by clicking a post card (title, description, location, date, and image).',
      'Images support JPG, PNG, WEBP up to 4MB.',
      'My Reports shows admin responses to your report issue.',
    ],
    ctaLabel: 'Open Profile',
    ctaHref: '/profile',
    mediaTone: 'profile',
  },
];

export default function Home() {
  const { currentUser } = useAuth();
  const [logoutNotice, setLogoutNotice] = React.useState('');

  React.useEffect(() => {
    const syncNotice = () => {
      if (typeof window === 'undefined') return;

      const message = sessionStorage.getItem(AUTH_NOTICE_KEY);
      if (message) {
        setLogoutNotice(message);
        sessionStorage.removeItem(AUTH_NOTICE_KEY);
      }
    };

    syncNotice();
    window.addEventListener(AUTH_NOTICE_EVENT, syncNotice);
    return () => window.removeEventListener(AUTH_NOTICE_EVENT, syncNotice);
  }, []);

  return (
    <main className={styles.page}>
      {logoutNotice && (
        <div className={styles.logoutNotice} role="status" aria-live="polite">
          {logoutNotice}
        </div>
      )}

      <section className={styles.heroSection}>
        <div className={styles.heroGlowA} />
        <div className={styles.heroGlowB} />
        <div className={styles.sectionInner}>
          <div className={styles.heroCopy}>
            <h1>Reconnecting people with their belongings</h1>
            <p>
              Helping students recover lost items, return found belongings, and communicate safely.
            </p>
            <div className={styles.heroActions}>
              <Link href="/lost-items" className={styles.primaryAction}>
                Start Searching
              </Link>
              <Link href="/found-items" className={styles.secondaryAction}>
                Browse Found Items
              </Link>
            </div>
            <div className={styles.anchorRow}>
              {featurePages.map((page) => (
                <a key={page.label} href={`#${page.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  {page.label} {page.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {featurePages.map((feature, index) => {
        const reverse = index % 2 === 1;
        const sectionId = feature.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        return (
          <section
            key={feature.title}
            id={sectionId}
            className={`${styles.featureSection} ${reverse ? styles.featureSectionReverse : ''} ${
              index === 2 ? `${styles.featureSectionDark} ${styles.reportEmphasis}` : ''
            }`}
          >
            <div className={styles.sectionInner}>
              <div className={styles.featureCopy}>
                <span className={styles.featureLabel}>{feature.label} {feature.title}</span>
                <h2>{feature.title}</h2>
                <p>{feature.body}</p>
                <ul>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <div className={styles.featureActions}>
                  <Link href={feature.ctaHref} className={styles.featureAction}>
                    {feature.ctaLabel}
                  </Link>
                  {feature.title === 'Browsing and Posting' && (
                    <Link href="/found-items" className={styles.featureActionSecondary}>
                      Browse Found Items
                    </Link>
                  )}
                </div>
              </div>

              <div className={styles.featureVisual} data-tone={feature.mediaTone}>
                {feature.title === 'Browsing and Posting' ? (
                  <div className={styles.browsePreviewFrame}>
                    <div className={styles.browsePreviewGrid}>
                      {browsingPreviewCards.map((card) => (
                        <article key={card.id} className={styles.previewCard}>
                          <div className={styles.previewCardImageWrap}>
                            <div className={styles.previewCardImage} style={{ '--bottle-color': card.tint }} />
                          </div>
                          <div className={styles.previewCardBody}>
                            <div className={styles.previewCardTopMeta}>
                              <span className={styles.previewLostBadge}>Lost</span>
                              <button type="button" className={styles.previewIdButton}>Copy ID</button>
                            </div>
                            <span className={styles.previewPostId}>Post ID {card.id}</span>
                            <h3>{card.title}</h3>
                            <p>{card.subtitle}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : feature.title === 'How to Message Post Owners' ? (
                  <div className={styles.messagePreviewFrame}>
                    <div className={styles.messagePreviewHeader}>
                      <h3>Messages</h3>
                    </div>
                    <div className={styles.messagePreviewShell}>
                      <aside className={styles.messageSidebar}>
                        <div className={styles.messageSidebarTitle}>Conversations</div>
                        <div className={styles.messageThreadItem}>
                          <div className={styles.messageAvatar}>J</div>
                          <div className={styles.messageThreadText}>
                            <strong>jimmy@gmail.com</strong>
                            <span>Lost Item</span>
                            <em>Yo I found your lost item.</em>
                          </div>
                        </div>
                      </aside>
                      <div className={styles.messageConversationPane}>
                        <div className={styles.messageConversationTop}>
                          <div>
                            <strong>jimmy@gmail.com</strong>
                            <span>Conversation type: Lost Item</span>
                          </div>
                          <div className={styles.messageConversationActions}>
                            <button type="button" className={styles.messageDangerBtn}>End Conversation</button>
                            <button type="button" className={styles.messageMutedBtn}>Block User</button>
                          </div>
                        </div>
                        <div className={styles.messageBodyArea}>
                          <div className={styles.messageBubble}>Yo I found your lost item.</div>
                        </div>
                        <div className={styles.messageComposer}>
                          <input type="text" readOnly value="Type a message..." />
                          <button type="button">Send</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : feature.title === 'Report to Admin' ? (
                  <div className={styles.reportPreviewFrame}>
                    <div className={styles.reportPreviewCard}>
                      <h3>Report an Issue</h3>
                      <p>
                        Help us maintain a safe community by reporting inappropriate content,
                        harassment, scams, or other issues.
                      </p>

                      <div className={styles.reportFieldGroup}>
                        <label>Report Category *</label>
                        <div className={styles.reportSelectMock}>Select a category...</div>
                      </div>

                      <div className={styles.reportFieldGroup}>
                        <label>Title *</label>
                        <div className={styles.reportInputMock}>Brief summary of the issue</div>
                        <span className={styles.reportCount}>0/100</span>
                      </div>

                      <div className={styles.reportFieldGroup}>
                        <label>Description *</label>
                        <div className={styles.reportTextareaMock}>Provide detailed information about the issue...</div>
                        <span className={styles.reportCount}>0/2000</span>
                      </div>

                      <div className={styles.reportFieldGroup}>
                        <label>Related Post ID *</label>
                        <div className={styles.reportInputMock}>Required - copy from a post card</div>
                      </div>

                      <div className={styles.reportActionsMock}>
                        <button type="button" className={styles.reportCancelMock}>Cancel</button>
                        <button type="button" className={styles.reportSubmitMock}>Submit Report</button>
                      </div>
                    </div>
                  </div>
                ) : feature.title === 'Profile and Tools' ? (
                  <div className={styles.profilePreviewFrame}>
                    <div className={styles.profileHeader}>
                      <h3>Profile & Settings</h3>
                      <p>Choose a tool below. Each option is on a separate page.</p>
                    </div>

                    <div className={styles.profileGrid}>
                      <Link href="/profile/account-info" className={styles.profileCard}>
                        <h4>Account Info</h4>
                        <p>View email, display name, role, and account status.</p>
                      </Link>

                      <Link href="/profile/reset-password" className={styles.profileCard}>
                        <h4>Reset Password</h4>
                        <p>Change your password securely.</p>
                      </Link>

                      <Link href="/profile/unblock-list" className={styles.profileCard}>
                        <h4>Unblock Users List</h4>
                        <p>See all blocked users and unblock them.</p>
                      </Link>

                      <Link href="/my-posts" className={styles.profileCard}>
                        <h4>My Posts</h4>
                        <p>Go to all posts you created previously.</p>
                      </Link>

                      {currentUser && currentUser.isAdmin && (
                        <Link href="/admin" className={styles.profileCard}>
                          <h4>Admin Dashboard</h4>
                          <p>Admin moderation and management tools.</p>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.visualFrame}>
                    <div className={styles.visualCardMain}>
                      <span>Reunite</span>
                      <strong>{feature.title}</strong>
                      <p>{feature.body}</p>
                    </div>
                    <div className={styles.visualCardAccent} />
                    <div className={styles.visualStats}>
                      <div>
                        <span>{currentUser ? 'Your account' : 'Guest mode'}</span>
                        <strong>{currentUser ? 'Ready' : 'Explore'}</strong>
                      </div>
                      <div>
                        <span>Focus</span>
                        <strong>{feature.label}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <div className={styles.ctaCard}>
            <h2>Ready to find what&apos;s missing?</h2>
            <p>Join our community to reconnect people with their belongings.</p>
            <div className={styles.ctaActions}>
              {!currentUser && (
                <Link href="/register" className={styles.primaryAction}>
                  Create Free Account
                </Link>
              )}
              <Link href="/lost-items" className={styles.secondaryAction}>
                Start Searching
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}