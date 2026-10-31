import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { AppDataProvider } from '@/store/AppDataContext';
import { NotificationProvider } from '@/store/NotificationContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { ToastProvider } from '@/store/ToastContext';

import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';
import { Dashboard } from '@/pages/Dashboard';
import { StudyPlan } from '@/pages/StudyPlan';
import { StudySession } from '@/pages/StudySession';
import { AITutor } from '@/pages/AITutor';
import { StudyGroups } from '@/pages/StudyGroups';
import { Assessments } from '@/pages/Assessments';
import { Progress } from '@/pages/Progress';
import { Achievements } from '@/pages/Achievements';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { ResumeMaker } from '@/pages/ResumeMaker';
import { CodeDebugger } from '@/pages/CodeDebugger';
import { CodingProblemsList } from '@/pages/CodingProblemsList';
import { CodingProblemDetail } from '@/pages/CodingProblemDetail';
import { AdminCodingStudio } from '@/pages/AdminCodingStudio';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-lg font-bold">
            403
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Access Denied</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            This studio portal is restricted to authorized instructors and system administrators.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/plan"
        element={
          <ProtectedRoute>
            <StudyPlan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/session"
        element={
          <ProtectedRoute>
            <StudySession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/tutor"
        element={
          <ProtectedRoute>
            <AITutor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/groups"
        element={
          <ProtectedRoute>
            <StudyGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/assessments"
        element={
          <ProtectedRoute>
            <Assessments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/progress"
        element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/achievements"
        element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/resume"
        element={
          <ProtectedRoute>
            <ResumeMaker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/debugger"
        element={
          <ProtectedRoute>
            <CodeDebugger />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/coding"
        element={
          <ProtectedRoute>
            <CodingProblemsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/coding/problems/:slug"
        element={
          <ProtectedRoute>
            <CodingProblemDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/admin/coding"
        element={
          <AdminRoute>
            <AdminCodingStudio />
          </AdminRoute>
        }
      />
      <Route
        path="/debugger"
        element={<Navigate to="/app/debugger" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { ErrorBoundary } from '@/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppDataProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </AppDataProvider>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
