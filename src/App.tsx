import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupSuccess from './pages/SignupSuccess';
import Engage from './pages/Engage';
import Dashboard from './pages/Dashboard';
import CampaignHistory from './pages/CampaignHistory';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/success" element={<SignupSuccess />} />
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
          {/* Redirect everything else to /engage (the main page) */}
          <Route path="*" element={<Navigate to="/engage" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
