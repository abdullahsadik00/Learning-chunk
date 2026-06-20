import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProjectsPage from '@/pages/ProjectsPage';
import DashboardPage from '@/pages/DashboardPage';
import EventsPage from '@/pages/EventsPage';
import SettingsPage from '@/pages/SettingsPage';

/** Redirects unauthenticated users to /login */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** Redirects authenticated users away from auth pages */
function GuestRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) {
    return <Navigate to="/projects" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/projects" replace />} />

      {/* Auth routes — redirect to /projects if already logged in */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/events"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback 404 */}
      <Route
        path="*"
        element={
          <div className="flex items-center justify-center min-h-screen text-slate-400">
            <div className="text-center">
              <p className="text-6xl font-bold text-slate-700">404</p>
              <p className="mt-2">Page not found</p>
              <a href="/projects" className="mt-4 inline-block text-indigo-400 hover:underline">
                Go home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
