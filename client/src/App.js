import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import LostItemDetail from './pages/LostItemDetail';
import FoundItemDetail from './pages/FoundItemDetail';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import Messages from './pages/Messages';
import MyPosts from './pages/MyPosts';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/lost-items" element={<LostItems />} />
              <Route path="/lost-items/:id" element={<LostItemDetail />} />
              <Route path="/found-items" element={<FoundItems />} />
              <Route path="/found-items/:id" element={<FoundItemDetail />} />
              <Route path="/report-lost" element={<ReportLost />} />
              <Route path="/report-found" element={<ReportFound />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/my-posts" element={<MyPosts />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
// Build trigger
