import React, { Suspense, useState } from 'react';

const TwitterFeedDemo = React.lazy(() => import('./systems/TwitterFeed/TwitterFeedDemo'));
const ECommerceDemo = React.lazy(() => import('./systems/ECommerce/ECommerceDemo'));
const DashboardDemo = React.lazy(() => import('./systems/AnalyticsDashboard/DashboardDemo'));
const ChatDemo = React.lazy(() => import('./systems/ChatApp/ChatDemo'));
const PatternsDemo = React.lazy(() => import('./patterns/PatternsDemo'));

type Tab = 'patterns' | 'feed' | 'ecommerce' | 'dashboard' | 'chat';

const tabs: { id: Tab; label: string }[] = [
  { id: 'patterns', label: 'Patterns' },
  { id: 'feed', label: 'Twitter Feed' },
  { id: 'ecommerce', label: 'E-Commerce' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chat', label: 'Chat' },
];

function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        fontSize: '1.2rem',
        color: '#94a3b8',
      }}
    >
      Loading demo…
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('patterns');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          gap: '0.25rem',
          padding: '1rem 1.5rem',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8', marginRight: '1rem', alignSelf: 'center' }}>
          System Design
        </span>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              background: activeTab === tab.id ? '#38bdf8' : '#334155',
              color: activeTab === tab.id ? '#0f172a' : '#cbd5e1',
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '1.5rem' }}>
        <Suspense fallback={<Loading />}>
          {activeTab === 'patterns' && <PatternsDemo />}
          {activeTab === 'feed' && <TwitterFeedDemo />}
          {activeTab === 'ecommerce' && <ECommerceDemo />}
          {activeTab === 'dashboard' && <DashboardDemo />}
          {activeTab === 'chat' && <ChatDemo />}
        </Suspense>
      </main>
    </div>
  );
}
