# Reunite Product Requirements Document (PRD)

## 1. Product Overview
Reunite is a campus-focused web platform that helps students recover lost belongings, return found items, and communicate safely with each other.

### Product goals
- Reduce time-to-recovery for lost items.
- Make posting and discovery easy for students.
- Provide safe communication and moderation workflows.
- Give admins clear reporting and account-management tools.

## 2. Target Users
- Students who lost an item.
- Students who found an item.
- Admins who moderate reports, posts, and user behavior.

## 3. Problem Statement
Campus communities need a trusted, simple workflow for lost-and-found that is faster and more structured than social media or bulletin boards.

## 4. Core User Flows
### Lost-item owner flow
1. Register/login.
2. Create a lost item post with details and optional image.
3. Browse found listings and filter results.
4. Message potential matches.
5. Recover item and resolve conversation.

### Finder flow
1. Register/login.
2. Create a found item post with details and optional image.
3. Receive messages from potential owners.
4. Confirm ownership through identifying details.

### Safety/reporting flow
1. Open Report Issue page.
2. Provide related post ID and reason.
3. Submit report for admin review.
4. Receive admin response in My Reports.

## 5. Functional Requirements
### Authentication and accounts
- Users can register with email and password.
- Users can login/logout.
- Authenticated users can view and manage their profile.
- Users can reset password and unblock users.

### Posting and discovery
- Users can create, edit, and delete their own lost/found posts.
- Public users can browse active lost/found posts.
- Listing pages support filtering and sorting.
- Detail pages show post information and matching actions.

### Messaging
- Authenticated users can message post owners.
- Conversation lists show unread counts.
- Users can block and unblock other users.

### Reporting and moderation
- Users can submit reports tied to a related post ID.
- Admins can review reports and respond.
- Admin report responses are delivered through My Reports (not direct Messages).
- Admin report notifications are tracked per report and cleared when that specific report is opened.
- Admins can manage user account status and enforcement actions.
- Admin force logout and account deletion invalidate affected user sessions.

### Media handling
- Supported image types: JPG, PNG, WEBP.
- Max upload size: 4MB.
- Images can be stored locally and migrated to Vercel Blob when configured.

## 6. Non-Functional Requirements
- Responsive UI for desktop and mobile.
- Secure JWT-based auth and protected API routes.
- Reliable data persistence in MongoDB.
- Basic accessibility support for navigation and form actions.

## 7. Success Metrics
- Number of active posts per week.
- Number of message conversations initiated from item posts.
- Median time from post creation to resolution.
- Report response time by admins.
- Weekly resolved-item rate.

## 8. Constraints and Assumptions
- School users have valid school email addresses.
- Moderation resources are limited; workflows must remain lightweight.
- Initial deployments may run with local upload storage in development.

## 9. Release Scope
### In scope
- Auth, posting, browsing, messaging, reporting, admin moderation.
- Image upload with current size/type constraints.

### Out of scope (current version)
- Native mobile applications.
- Automated ownership verification beyond user-provided details.
- Public anonymous posting without account authentication.

## 10. Risks and Mitigations
- Risk: False ownership claims.
- Mitigation: Encourage private verification details in messaging.

- Risk: Abuse/spam messaging.
- Mitigation: Block/unblock controls and admin reporting pipeline.

- Risk: Storage growth from image uploads.
- Mitigation: Enforce size/type limits and optional blob migration.

## 11. Open Questions
- Should there be explicit post status values (open, matched, returned)?
- Should report categories be standardized for analytics?
- Should notifications be expanded to email/push in a future release?
