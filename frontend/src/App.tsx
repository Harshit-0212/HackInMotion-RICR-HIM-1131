import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { AppDataProvider } from '@/store/AppDataContext';
import { NotificationProvider } from '@/store/NotificationContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { ToastProvider } from '@/store/ToastContext';
import { FullPageLoader } from '@/components/ui/FullPageLoader';
import { ErrorBoundary } from '@/ErrorBoundary';

// Lazy-loaded routes matching Phase 7
const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })));
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Signup = lazy(() => import('@/pages/Signup').then((m) => ({ default: m.Signup })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const StudyPlan = lazy(() => import('@/pages/StudyPlan').then((m) => ({ default: m.StudyPlan })));
const StudySession = lazy(() => import('@/pages/StudySession').then((m) => ({ default: m.StudySession })));
const AITutor = lazy(() => import('@/pages/AITutor').then((m) => ({ default: m.AITutor })));
const StudyGroups = lazy(() => import('@/pages/StudyGroups').then((m) => ({ default: m.StudyGroups })));
const Assessments = lazy(() => import('@/pages/Assessments').then((m) => ({ default: m.Assessments })));
const Progress = lazy(() => import('@/pages/Progress').then((m) => ({ default: m.Progress })));
const Achievements = lazy(() => import('@/pages/Achievements').then((m) => ({ default: m.Achievements })));
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const ResumeMaker = lazy(() => import('@/pages/ResumeMaker').then((m) => ({ default: m.ResumeMaker })));
const CodeDebugger = lazy(() => import('@/pages/CodeDebugger').then((m) => ({ default: m.CodeDebugger })));
const CodingProblemsList = lazy(() => import('@/pages/CodingProblemsList').then((m) => ({ default: m.CodingProblemsList })));
const CodingProblemDetail = lazy(() => import('@/pages/CodingProblemDetail').then((m) => ({ default: m.CodingProblemDetail })));
const AdminCodingStudio = lazy(() => import('@/pages/AdminCodingStudio').then((m) => ({ default: m.AdminCodingStudio })));
const LearningJourney = lazy(() => import('@/pages/LearningJourney').then((m) => ({ default: m.LearningJourney })));
const StageDetail = lazy(() => import('@/pages/StageDetail').then((m) => ({ default: m.StageDetail })));
const StageCheckpoint = lazy(() => import('@/pages/StageCheckpoint').then((m) => ({ default: m.StageCheckpoint })));
const CodeComprehensionList = lazy(() => import('@/pages/CodeComprehensionList').then((m) => ({ default: m.CodeComprehensionList })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return <FullPageLoader message="Verifying session..." submessage="Checking credentials" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isInitializing } = useAuth();
  if (isInitializing) return <FullPageLoader message="Verifying permissions..." submessage="Accessing administrative studio" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EDE6] dark:bg-[#141217] p-4">
        <div className="max-w-md w-full bg-[#FBF8F2] dark:bg-[#1D1922] border border-[#D8D0C5] dark:border-white/10 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E53E3E]/10 text-[#E53E3E] flex items-center justify-center mx-auto text-lg font-bold">
            403
          </div>
          <h3 className="text-base font-bold text-[#211D28] dark:text-[#F5F0E8]">Access Denied</h3>
          <p className="text-xs text-[#5F5668] dark:text-[#B8AFBE]">
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
  if (isInitializing) return <FullPageLoader message="Loading Cadence..." submessage="Checking active session" />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<FullPageLoader message="Loading workspace..." submessage="Preparing module" />}>
      <PageTransitionWrapper>
        <Routes location={location}>
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
            path="/app/journey"
            element={
              <ProtectedRoute>
                <LearningJourney />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/journey/:journeySlug/stage/:stageSlug"
            element={
              <ProtectedRoute>
                <StageDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/journey/:journeySlug/stage/:stageSlug/checkpoint"
            element={
              <ProtectedRoute>
                <StageCheckpoint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/comprehension"
            element={
              <ProtectedRoute>
                <CodeComprehensionList />
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
      </PageTransitionWrapper>
    </Suspense>
  );
}

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
