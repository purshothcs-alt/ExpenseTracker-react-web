import { Routes, Route, Navigate } from 'react-router';
import { AppLayout } from '@core/components/Layout/AppLayout';
import { ErrorBoundary } from '@core/components/ErrorBoundary/ErrorBoundary';
import { Suspense, lazy } from 'react';
import { LoadingScreen } from '@core/components/common/LoadingScreen';

const DashboardPage = lazy(() => import('@features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AccountsPage = lazy(() => import('@features/accounts/pages/AccountsPage').then(m => ({ default: m.AccountsPage })));
const TransactionsPage = lazy(() => import('@features/transactions/pages/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const BudgetsPage = lazy(() => import('@features/budgets/pages/BudgetsPage').then(m => ({ default: m.BudgetsPage })));
const GoalsPage = lazy(() => import('@features/goals/pages/GoalsPage').then(m => ({ default: m.GoalsPage })));
const LoansPage = lazy(() => import('@features/loans/pages/LoansPage').then(m => ({ default: m.LoansPage })));
const AssetsPage = lazy(() => import('@features/assets/pages/AssetsPage').then(m => ({ default: m.AssetsPage })));
const ProjectsPage = lazy(() => import('@features/projects/pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('@features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdministrationPage = lazy(() => import('@features/administration/pages/AdministrationPage').then(m => ({ default: m.AdministrationPage })));

export function App() {
  return (
    <ErrorBoundary>
      <AppLayout>
        <Suspense fallback={<LoadingScreen message="Loading..." />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/administration" element={<AdministrationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </ErrorBoundary>
  );
}
