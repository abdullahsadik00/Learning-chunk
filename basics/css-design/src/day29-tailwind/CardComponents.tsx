import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// BasicCard
// ---------------------------------------------------------------------------

export interface BasicCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function BasicCard({ title, children, className, footer }: BasicCardProps) {
  return (
    <div
      className={twMerge(
        'bg-slate-800 rounded-xl ring-1 ring-slate-700 hover:shadow-lg hover:shadow-black/30 transition-shadow duration-200',
        className
      )}
    >
      <div className="p-5">
        {title && <h3 className="text-base font-semibold text-white mb-3">{title}</h3>}
        <div className="text-slate-300 text-sm">{children}</div>
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImageCard
// ---------------------------------------------------------------------------

export interface ImageCardProps {
  imageUrl: string;
  imageAlt: string;
  category?: string;
  title: string;
  description: string;
  author?: string;
  date?: string;
  actions?: React.ReactNode;
}

export function ImageCard({ imageUrl, imageAlt, category, title, description, author, date, actions }: ImageCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 overflow-hidden hover:shadow-xl hover:shadow-black/40 transition-all duration-200 hover:-translate-y-0.5 group">
      {/* Image */}
      <div className="relative overflow-hidden h-44">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {category && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-indigo-600 text-white px-2.5 py-1 rounded-full">
            {category}
          </span>
        )}
      </div>
      {/* Body */}
      <div className="p-5">
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-slate-400 line-clamp-3">{description}</p>
      </div>
      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        {(author || date) && (
          <div className="text-xs text-slate-500">
            {author && <span className="text-slate-400 font-medium">{author}</span>}
            {author && date && <span className="mx-1.5">·</span>}
            {date && <span>{date}</span>}
          </div>
        )}
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline (simple SVG)
// ---------------------------------------------------------------------------

function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? '#34d399' : '#fb7185'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

export interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  sparkData: number[];
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, positive = true, sparkData, icon }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5 hover:shadow-lg hover:shadow-black/30 transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        {icon && (
          <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded',
              positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
            )}
          >
            {positive ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {change}
          </span>
          <span className="text-xs text-slate-500">vs last month</span>
        </div>
        <Sparkline data={sparkData} positive={positive} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileCard
// ---------------------------------------------------------------------------

export interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl: string;
  followers: number;
  following: number;
  projects: number;
  bio?: string;
}

export function ProfileCard({ name, role, avatarUrl, followers, following, projects, bio }: ProfileCardProps) {
  const [followed, setFollowed] = useState(false);

  return (
    <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 overflow-hidden hover:shadow-lg hover:shadow-black/30 transition-shadow">
      {/* Cover */}
      <div className="h-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
      {/* Avatar */}
      <div className="px-5 pb-5">
        <div className="relative -mt-8 mb-3 flex items-end justify-between">
          <img
            src={avatarUrl}
            alt={name}
            className="h-16 w-16 rounded-xl ring-2 ring-slate-800 object-cover"
          />
          <button
            onClick={() => setFollowed((f) => !f)}
            className={clsx(
              'text-xs font-semibold h-8 px-4 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              followed
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            )}
          >
            {followed ? 'Following' : 'Follow'}
          </button>
        </div>
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <p className="text-sm text-indigo-400 mb-2">{role}</p>
        {bio && <p className="text-xs text-slate-400 mb-4 line-clamp-2">{bio}</p>}
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700">
          {[
            { label: 'Followers', value: followers.toLocaleString() },
            { label: 'Following', value: following.toLocaleString() },
            { label: 'Projects', value: projects.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-sm font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PricingCard
// ---------------------------------------------------------------------------

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  highlighted?: boolean;
}

export function PricingCard({ name, price, period = '/mo', description, features, cta, highlighted }: PricingCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl p-6 flex flex-col transition-shadow hover:shadow-xl',
        highlighted
          ? 'bg-indigo-600 ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/25'
          : 'bg-slate-800 ring-1 ring-slate-700 hover:shadow-black/30'
      )}
    >
      {highlighted && (
        <span className="self-start text-xs font-semibold bg-white/20 text-white px-2.5 py-0.5 rounded-full mb-4">
          Most popular
        </span>
      )}
      <h3 className={clsx('text-base font-semibold', highlighted ? 'text-white' : 'text-slate-200')}>{name}</h3>
      <p className={clsx('text-xs mt-1 mb-4', highlighted ? 'text-indigo-200' : 'text-slate-400')}>{description}</p>
      <div className="mb-6">
        <span className={clsx('text-3xl font-bold', highlighted ? 'text-white' : 'text-white')}>{price}</span>
        {period && <span className={clsx('text-sm ml-1', highlighted ? 'text-indigo-200' : 'text-slate-400')}>{period}</span>}
      </div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5">
            {f.included ? (
              <svg className={clsx('h-4 w-4 shrink-0', highlighted ? 'text-indigo-200' : 'text-emerald-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={clsx('text-sm', f.included ? (highlighted ? 'text-indigo-100' : 'text-slate-300') : 'text-slate-600')}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <button
        className={clsx(
          'w-full h-10 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          highlighted
            ? 'bg-white text-indigo-700 hover:bg-indigo-50 focus-visible:ring-white focus-visible:ring-offset-indigo-600'
            : 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus-visible:ring-slate-500 focus-visible:ring-offset-slate-900'
        )}
      >
        {cta}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotificationCard
// ---------------------------------------------------------------------------

export interface NotificationCardProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
}

const notifStyles = {
  info: { icon: '💬', ring: 'ring-blue-500/30', dot: 'bg-blue-400' },
  success: { icon: '✅', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400' },
  warning: { icon: '⚠️', ring: 'ring-amber-500/30', dot: 'bg-amber-400' },
  error: { icon: '❌', ring: 'ring-rose-500/30', dot: 'bg-rose-400' },
};

export function NotificationCard({ type, title, message, time }: NotificationCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const style = notifStyles[type];

  return (
    <div
      className={clsx(
        'bg-slate-800 rounded-xl ring-1 p-4 flex gap-3 hover:shadow-md transition-shadow animate-fade-in',
        style.ring
      )}
    >
      <span className="text-xl shrink-0 mt-0.5">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={clsx('h-2 w-2 rounded-full shrink-0', style.dot)} />
            <p className="text-sm font-medium text-white truncate">{title}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 ml-4">{message}</p>
        <p className="text-xs text-slate-600 mt-1.5 ml-4">{time}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

const SPARK_UP = [12, 18, 14, 22, 26, 21, 30, 28, 35, 40];
const SPARK_DOWN = [40, 38, 35, 30, 28, 32, 25, 20, 18, 15];

const PRICING_FEATURES_FREE: PricingFeature[] = [
  { text: 'Up to 3 projects', included: true },
  { text: 'Community support', included: true },
  { text: '1 GB storage', included: true },
  { text: 'Custom domain', included: false },
  { text: 'Analytics dashboard', included: false },
];

const PRICING_FEATURES_PRO: PricingFeature[] = [
  { text: 'Unlimited projects', included: true },
  { text: 'Priority email support', included: true },
  { text: '20 GB storage', included: true },
  { text: 'Custom domain', included: true },
  { text: 'Analytics dashboard', included: false },
];

const PRICING_FEATURES_TEAM: PricingFeature[] = [
  { text: 'Unlimited projects', included: true },
  { text: 'Dedicated support', included: true },
  { text: '100 GB storage', included: true },
  { text: 'Custom domain', included: true },
  { text: 'Analytics dashboard', included: true },
];

export function CardComponentsDemo() {
  return (
    <div className="space-y-12">
      {/* Basic cards */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Basic cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BasicCard title="Getting started">
            <p>This is a basic card component. Hover to see the shadow elevation change.</p>
          </BasicCard>
          <BasicCard title="With footer" footer={<p className="text-xs text-slate-500">Last updated 2 hours ago</p>}>
            <p>Cards can have an optional footer slot for metadata or actions.</p>
          </BasicCard>
          <BasicCard>
            <p className="text-slate-400">No title — content only. Flexible for any layout.</p>
          </BasicCard>
        </div>
      </section>

      {/* Image cards */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Image cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { id: 10, category: 'Technology', title: 'The future of distributed systems', desc: 'Exploring how modern architectures handle scale, resilience, and developer experience simultaneously.' },
            { id: 20, category: 'Design', title: 'Principles of visual hierarchy', desc: 'How the human eye moves through a composition and what designers can do to guide attention effectively.' },
            { id: 30, category: 'Engineering', title: 'Zero-downtime deployments', desc: 'Strategies for shipping continuously without waking up at 3am. Blue-green, canary, and feature flags.' },
          ].map((item) => (
            <ImageCard
              key={item.id}
              imageUrl={`https://picsum.photos/seed/${item.id}/600/300`}
              imageAlt={item.title}
              category={item.category}
              title={item.title}
              description={item.desc}
              author="Ada Lovelace"
              date="Jun 20, 2026"
              actions={
                <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                  Read more →
                </button>
              }
            />
          ))}
        </div>
      </section>

      {/* Stat cards */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Stat / KPI cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Monthly revenue" value="$48,295" change="+12.4%" positive sparkData={SPARK_UP}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Active users" value="12,847" change="+8.1%" positive sparkData={[20, 22, 18, 25, 30, 28, 35, 32, 38, 42]}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <StatCard label="Churn rate" value="2.3%" change="-0.8%" positive={false} sparkData={SPARK_DOWN}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>}
          />
          <StatCard label="Conversion" value="4.6%" change="+1.2%" positive sparkData={[5, 6, 4, 7, 8, 7, 9, 8, 10, 11]}
            icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
          />
        </div>
      </section>

      {/* Profile cards */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Profile cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProfileCard name="Ada Lovelace" role="Senior Engineer" avatarUrl="https://picsum.photos/seed/ada/80/80" followers={4821} following={312} projects={28} bio="Building the future of computing, one algorithm at a time." />
          <ProfileCard name="Grace Hopper" role="Compiler Pioneer" avatarUrl="https://picsum.photos/seed/grace/80/80" followers={12400} following={89} projects={15} bio="Found a literal bug in a computer once. Coined the term." />
          <ProfileCard name="Linus Torvalds" role="Kernel Maintainer" avatarUrl="https://picsum.photos/seed/linus/80/80" followers={99000} following={3} projects={7} bio="Just for fun." />
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Pricing cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <PricingCard name="Free" price="$0" description="Get started for free" features={PRICING_FEATURES_FREE} cta="Start free" />
          <PricingCard name="Pro" price="$12" description="For serious builders" features={PRICING_FEATURES_PRO} cta="Get Pro" highlighted />
          <PricingCard name="Team" price="$49" description="For growing teams" features={PRICING_FEATURES_TEAM} cta="Get Team" />
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Notification cards</h3>
        <div className="max-w-sm space-y-3">
          <NotificationCard type="success" title="Deployment successful" message="v2.4.1 is live on production." time="2 minutes ago" />
          <NotificationCard type="warning" title="High memory usage" message="Instance i-0abc is at 87% memory." time="15 minutes ago" />
          <NotificationCard type="error" title="Build failed" message="Step 3 of 6 exited with code 1." time="32 minutes ago" />
          <NotificationCard type="info" title="New comment" message="Ada replied to your PR #142." time="1 hour ago" />
        </div>
      </section>
    </div>
  );
}
