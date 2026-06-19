import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ScoringPage from './pages/ScoringPage';
import SettingsPage from './pages/SettingsPage';
import ExplainabilityPage from './pages/ExplainabilityPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import DatasetInsightsPage from './pages/DatasetInsightsPage';
import AboutProjectPage from './pages/AboutProjectPage';

// Internal App Layout (Sidebar + Navbar + Content wrapper)
function AppLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Bar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 pt-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected App Views */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scoring" element={<ScoringPage />} />
            <Route path="/explainability" element={<ExplainabilityPage />} />
            <Route path="/model-performance" element={<ModelPerformancePage />} />
            <Route path="/dataset-insights" element={<DatasetInsightsPage />} />
            <Route path="/about-project" element={<AboutProjectPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

