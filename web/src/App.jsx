import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppLayout from './components/layout/AppLayout';

// Task 33.4: Code-split routes via React.lazy
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const EndpointsPage = lazy(() => import('./pages/EndpointsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Task 33.2: Tune TanStack Query caching parameters (30s staleTime)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 1000 * 60 * 60, // 1 hour TTL
    },
  },
});

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-relay-purple/30 border-t-relay-purple rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-relay-subtext">Loading view module...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="endpoints" element={<EndpointsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
