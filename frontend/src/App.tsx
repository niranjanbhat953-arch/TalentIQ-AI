import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobListingsPage } from './pages/JobListingsPage';
import { CreateEditJobPage } from './pages/CreateEditJobPage';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { ScreeningProgressPage } from './pages/ScreeningProgressPage';
import { CandidateResultsPage } from './pages/CandidateResultsPage';
import { CandidateDetailPage } from './pages/CandidateDetailPage';
import { CandidateComparisonPage } from './pages/CandidateComparisonPage';
import { InterviewAssistantPage } from './pages/InterviewAssistantPage';
import { ResumeQualityAnalyzerPage } from './pages/ResumeQualityAnalyzerPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { ScreeningHistoryPage } from './pages/ScreeningHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />

            {/* Protected SaaS Recruiter Console */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/jobs" element={<JobListingsPage />} />
              <Route path="/jobs/new" element={<CreateEditJobPage />} />
              <Route path="/jobs/:jobId/edit" element={<CreateEditJobPage />} />
              <Route path="/resumes/upload" element={<ResumeUploadPage />} />
              <Route path="/screening" element={<ScreeningProgressPage />} />
              <Route path="/candidates" element={<CandidateResultsPage />} />
              <Route path="/candidates/:id" element={<CandidateDetailPage />} />
              <Route path="/comparison" element={<CandidateComparisonPage />} />
              <Route path="/interviews" element={<InterviewAssistantPage />} />
              <Route path="/quality-analyzer" element={<ResumeQualityAnalyzerPage />} />
              <Route path="/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/history" element={<ScreeningHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
