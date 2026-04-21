# Reunite Web Platform

A centralized web app for students to report lost items, post found items, and message each other for recovery.

## Product Documentation

- Product Requirements Document (PRD): `PRD.md`

Reunite is the official product name used across the app and documentation.

## Current Tech Stack

- Frontend: Next.js 14.2.5 + React 18.3.1
- Backend: Node.js + Express 4.21.0
- Database: MongoDB (Atlas or local) with Mongoose 8.9.5
- Authentication: JWT (email/password) with `jsonwebtoken`
- API Client: Axios 1.7.4
- Image Uploads: Local file uploads served from `/uploads`, with optional Vercel Blob migration/storage

## Project Structure

```text
CS4800HWA2/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context
│   │   └── lib/            # API client and helpers
├── server/                 # Express backend
│   └── src/
│       ├── config/         # MongoDB config
│       ├── middleware/     # JWT auth middleware
│       ├── models/         # Mongoose models
│       ├── routes/         # API routes
│       └── index.js        # Server entry
├── package.json            # Root scripts
└── README.md
```

## Beginner Setup (Step by Step)

### 1. Install prerequisites

- Node.js 18 or newer
- npm
- MongoDB (choose one):
  - MongoDB Atlas (cloud, easiest for beginners)
  - Local MongoDB Community Server on your machine

### 2. Download and open the project

```bash
cd /Users/calebszeto/vscode-school-projects/csschoolproject/CS4800HWA2
```

### 3. Install dependencies

Run at the project root:

```bash
npm install
npm run install-all
```

### 4. Set up server environment variables

1. Create `server/.env` (copy from `server/.env.example`).
2. Fill values like this:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db>?retryWrites=true&w=majority
MONGODB_DB_NAME=lost_and_found
JWT_SECRET=replace-with-a-long-random-secret
PUBLIC_BASE_URL=http://localhost:5000
POST_EXPIRATION_DAYS=30
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
```

If using local MongoDB, you can use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/lost_and_found
```

For Vercel deployment, set `BLOB_READ_WRITE_TOKEN` in the backend project environment variables so image uploads are stored in Vercel Blob.

### 5. Set up client environment variables

1. Create `client/.env.local`.
2. Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Notes:
- `client/.env.example` contains the same key for convenience.
- `NEXT_PUBLIC_API_URL` is the required frontend API base URL.

### 6. Start the app in development

From the root folder:

```bash
npm run dev
```

This starts:
- Backend on port 5000
- Frontend on port 3000

You can also run each separately:

```bash
# Backend
npm run server

# Frontend
npm run client
```

### 7. Verify everything is running

1. Open backend health check:
   - http://localhost:5000/api/health
2. Open frontend:
   - http://localhost:3000
3. In the app:
   - Register an account
   - Login
   - Create a lost item post
   - Create a found item post
   - Try an image upload

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login user |
| GET | /api/auth/me | Yes | Get current user |
| POST | /api/auth/change-password | Yes | Change password |
| POST | /api/lost-items | Yes | Create lost item post |
| GET | /api/lost-items | No | List active lost items |
| GET | /api/lost-items/:id | No | Get lost item detail |
| PUT | /api/lost-items/:id | Yes | Update lost item |
| DELETE | /api/lost-items/:id | Yes | Delete lost item |
| POST | /api/found-items | Yes | Create found item post |
| GET | /api/found-items | No | List active found items |
| GET | /api/found-items/:id | No | Get found item detail |
| PUT | /api/found-items/:id | Yes | Update found item |
| DELETE | /api/found-items/:id | Yes | Delete found item |
| POST | /api/messages | Yes | Send message |
| GET | /api/messages/conversations | Yes | List conversations |
| GET | /api/messages/:partnerId | Yes | Get messages with a user |
| POST | /api/messages/block/:userId | Yes | Block a user |
| DELETE | /api/messages/block/:userId | Yes | Unblock a user |
| GET | /api/messages/blocked | Yes | List blocked users |
| DELETE | /api/messages/conversation/:partnerId | Yes | End a conversation |
| POST | /api/reports | Yes | Create a report |
| GET | /api/reports/my-reports | Yes | Get current user's reports |
| GET | /api/reports/admin/reports | Admin | List reports for admins |
| PATCH | /api/reports/admin/reports/:id | Admin | Update report status/details |
| POST | /api/reports/admin/reports/:id/respond | Admin | Send admin response to report |
| GET | /api/admin/users | Admin | List users |
| GET | /api/admin/users/:id/history | Admin | User moderation history |
| GET | /api/admin/users/:id/posts | Admin | User post history |
| PATCH | /api/admin/users/:id/status | Admin | Set user status |
| POST | /api/admin/users/:id/force-logout | Admin | Force logout user |
| DELETE | /api/admin/users/:id | Admin | Delete user and related data |
| PATCH | /api/admin/posts/lost/:id | Admin | Moderate lost post |
| PATCH | /api/admin/posts/found/:id | Admin | Moderate found post |
| GET | /api/admin/posts/:type/:id/history | Admin | Post moderation history |
| GET | /api/admin/messages | Admin | List messages for moderation |
| DELETE | /api/admin/messages/:id | Admin | Delete message |
| GET | /api/admin/audit-logs | Admin | List admin audit logs |

## User Guide (App Usage)

### Edit your own post
- Open a lost or found item detail page.
- If you are the owner, use the Edit button to update title, description, location, and date.
- You can replace or remove the image in the edit form.

### Filters and search
- Use the filters on the Lost Items or Found Items pages to narrow results.
- Common filters include keyword, location, date, and sort order (most recent).

### Image upload limits and supported types
- Max image size: 4MB per upload.
- Supported types: JPG, PNG, and WEBP.

### Profile and My Reports
- Profile menu includes My Reports for tracking admin responses to your reports.
- New responses show a badge in the profile menu and a "New Response" label per report.
- Open a report to read the full response history.

### Admin report notifications
- Admin accounts see new open report indicators in both Profile and Admin Reports.
- New indicators are cleared per report when that report is opened, not when the dashboard is merely visited.

### Admin enforcement session behavior
- Force Logout invalidates a user's active session and redirects them to the home page on the next API check.
- Deleting a user account also invalidates session access and redirects the deleted user to the home page with a notice.

### Report to admin (requires post ID)
- Reporting an issue requires a Related Post ID.
- On a post card, click Copy ID to copy the post ID, then paste it into the report form.

## Common Beginner Issues

### MongoDB connection fails

- Check `MONGODB_URI` is correct.
- If using Atlas:
  - Make sure your DB user/password are correct.
  - Add your current IP to Atlas network access.
- If using local MongoDB:
  - Ensure MongoDB service is running.

### Login/register fails

- Check `JWT_SECRET` exists in `server/.env`.
- Restart server after changing `.env`.

### Frontend cannot reach backend

- Ensure `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in `client/.env.local`.
- Restart frontend after `.env.local` changes.

### Image upload fails

- Ensure backend is running.
- Ensure form includes an image file.
- Uploaded files are served from `/uploads` by the backend.

## Helpful Commands

Run from project root:

```bash
npm run dev           # run backend + frontend
npm run server        # backend only
npm run client        # frontend only
```

Run from server folder:

```bash
npm run dev           # nodemon server
npm start             # plain node server
npm run backfill:images:dry   # preview legacy image URL migrations
npm run backfill:images       # upload legacy local images to Vercel Blob and update DB
```

### Backfill Existing Image URLs to Vercel Blob

If older posts stored image URLs like `http://localhost:5000/uploads/...`, you can migrate them:

1. Set `BLOB_READ_WRITE_TOKEN` in `server/.env`.
2. Run a dry-run first:

```bash
cd server
npm run backfill:images:dry
```

3. If the dry-run summary looks correct, run the write mode:

```bash
npm run backfill:images
```

## Production Notes

For deployment, set production values for:
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET`
- `PUBLIC_BASE_URL`
- `NEXT_PUBLIC_API_URL`

Also configure secure CORS, HTTPS, and a persistent file storage strategy if you do not want local disk uploads in production
