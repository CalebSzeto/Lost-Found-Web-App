# Campus Lost & Found Web Platform

A centralized web application that enables students to report lost items, notify others about found items, and message each other to facilitate item recovery.

## Tech Stack

- **Frontend:** React (with React Router)
- **Backend:** Node.js + Express.js
- **Database:** Firebase Firestore
- **File Storage:** Firebase Storage
- **Authentication:** Firebase Authentication
- **Deployment Target:** AWS

## Project Structure

```
CS4800HWA2/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       │   ├── Auth/       # Login & Register
│       │   ├── Common/     # SearchBar, etc.
│       │   ├── Layout/     # Navbar & Footer
│       │   └── Posts/      # PostCard
│       ├── context/        # AuthContext (React Context)
│       ├── pages/          # Page-level components
│       ├── services/       # Firebase config & API client
│       ├── App.js
│       └── index.js
├── server/                 # Node.js backend
│   └── src/
│       ├── config/         # Firebase Admin config
│       ├── middleware/      # Auth middleware
│       ├── routes/         # API routes
│       └── index.js        # Express server entry
├── package.json            # Root scripts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm
- Firebase project (Firestore, Auth, Storage enabled)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Authentication** (Email/Password provider).
3. Create a **Firestore Database**.
4. Enable **Firebase Storage**.
5. Generate a **Service Account Key** (Project Settings → Service Accounts → Generate New Private Key).

### 2. Environment Variables

**Server** – copy `server/.env.example` to `server/.env` and fill in:

```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
POST_EXPIRATION_DAYS=30
```

**Client** – copy `client/.env.example` to `client/.env` and fill in your Firebase web config:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=000000000000
REACT_APP_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies

```bash
# Install all dependencies (root + server + client)
npm install
npm run install-all
```

### 4. Run in Development

```bash
# Run both server and client concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend (port 5000)
npm run server

# Terminal 2 - Frontend (port 3000)
npm run client
```

### 5. Open the App

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint                  | Auth | Description                   |
|--------|---------------------------|------|-------------------------------|
| POST   | /api/auth/register        | Yes  | Register user in Firestore    |
| GET    | /api/auth/me              | Yes  | Get current user profile      |
| POST   | /api/lost-items           | Yes  | Create lost item post         |
| GET    | /api/lost-items           | No   | Get all active lost items     |
| GET    | /api/lost-items/:id       | No   | Get single lost item          |
| PUT    | /api/lost-items/:id       | Yes  | Update lost item status       |
| DELETE | /api/lost-items/:id       | Yes  | Delete lost item post         |
| POST   | /api/found-items          | Yes  | Create found item post        |
| GET    | /api/found-items          | No   | Get all active found items    |
| GET    | /api/found-items/:id      | No   | Get single found item         |
| PUT    | /api/found-items/:id      | Yes  | Update found item status      |
| DELETE | /api/found-items/:id      | Yes  | Delete found item post        |
| POST   | /api/messages             | Yes  | Send a message                |
| GET    | /api/messages/conversations| Yes | Get user conversations        |
| GET    | /api/messages/:partnerId  | Yes  | Get messages with a user      |

## Features

- **User Authentication** – Register/login with email & password via Firebase Auth
- **Lost Item Reporting** – Post lost items with title, description, location, date, and optional image
- **Found Item Reporting** – Post found items with brief description and drop-off info
- **Direct Messaging** – Message other users about specific posts
- **Search & Filter** – Filter posts by keyword, location, and date
- **Post Management** – Delete your own posts, mark as resolved
- **Auto Expiration** – Posts automatically expire after 30 days
- **Responsive Design** – Works on desktop, tablet, and mobile

## Deployment (AWS)

For production deployment to AWS:

1. Build the React app: `cd client && npm run build`
2. Deploy the backend to AWS EC2 or Elastic Beanstalk
3. Serve the React build via S3 + CloudFront or from the Express server
4. Configure environment variables on the server
5. Enable HTTPS via AWS Certificate Manager
