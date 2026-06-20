'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  // Instantiate QueryClient inside the component so that each server-side
  // request gets its own cache (prevents sharing state between users in SSR).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,       // data is fresh for 30s before background refetch
            retry: 1,                // retry once on network error
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <html lang="en" className="dark">
      <head>
        <title>Snippets</title>
        <meta name="description" content="Team code snippet manager" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
