import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import JSXPage from './pages/01-jsx';
import HooksPage from './pages/02-hooks';
import PerfHooksPage from './pages/03-perf-hooks';
import ContextPage from './pages/04-context';
import InternalsPage from './pages/05-internals';
import AdvancedPage from './pages/06-advanced';
import StateMgmtPage from './pages/07-state-mgmt';
import PatternsPage from './pages/08-patterns';
import PerfPage from './pages/09-perf';
import TestingPage from './pages/10-testing';
import PracticePage from './pages/11-practice';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Navigate to="/02-hooks" replace />} />
            <Route path="01-jsx" element={<JSXPage />} />
            <Route path="02-hooks" element={<HooksPage />} />
            <Route path="03-perf-hooks" element={<PerfHooksPage />} />
            <Route path="04-context" element={<ContextPage />} />
            <Route path="05-internals" element={<InternalsPage />} />
            <Route path="06-advanced" element={<AdvancedPage />} />
            <Route path="07-state-mgmt" element={<StateMgmtPage />} />
            <Route path="08-patterns" element={<PatternsPage />} />
            <Route path="09-perf" element={<PerfPage />} />
            <Route path="10-testing" element={<TestingPage />} />
            <Route path="11-practice" element={<PracticePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
