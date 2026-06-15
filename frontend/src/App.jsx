import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import DashboardPage from './pages/DashboardPage';
import ScoringPage from './pages/ScoringPage';
import BatchPage from './pages/BatchPage';
import GovernancePage from './pages/GovernancePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col h-screen bg-gray-50">
          {/* Navigation Bar */}
          <Navbar />
          
          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/scoring" element={<ScoringPage />} />
                <Route path="/batch" element={<BatchPage />} />
                <Route path="/governance" element={<GovernancePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
