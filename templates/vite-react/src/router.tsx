import { RootLayout } from '@/components/layout/root-layout';
import { DashboardPage } from '@/pages/dashboard';
import { HomePage } from '@/pages/home';
import { NotFoundPage } from '@/pages/not-found';
import { BrowserRouter, Route, Routes } from 'react-router';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
