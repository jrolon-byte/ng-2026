import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupSuccess from './pages/SignupSuccess';
import Welcome from './pages/Welcome';
import Engage from './pages/Engage';
import Dashboard from './pages/Dashboard';
import CampaignHistory from './pages/CampaignHistory';
import AdminCompanies from './pages/AdminCompanies';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/success" element={<SignupSuccess />} />
          {/* One-time setup link from the welcome text (pay-first signup). */}
          <Route path="/welcome" element={<Welcome />} />
          {/* Public legal pages — App Store review, Twilio A2P vetting, and
              SMS recipients reach these without an account. */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/engage"
            element={
              <ProtectedRoute>
                <Engage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <CampaignHistory />
              </ProtectedRoute>
            }
          />
          {/* Super-admin only — the page redirects non-admins to /engage;
              the API enforces the real 403. */}
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute>
                <AdminCompanies />
              </ProtectedRoute>
            }
          />
          {/* Redirect everything else to /engage (the main page) */}
          <Route path="*" element={<Navigate to="/engage" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
