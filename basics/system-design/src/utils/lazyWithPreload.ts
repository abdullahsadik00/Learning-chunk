import { lazy } from 'react';
import type React from 'react';

type Factory<T> = () => Promise<{ default: T }>;

export function lazyWithPreload<T extends React.ComponentType<unknown>>(
  factory: Factory<T>
) {
  let factoryPromise: Promise<{ default: T }> | null = null;

  const LazyComponent = lazy(() => {
    if (!factoryPromise) factoryPromise = factory();
    return factoryPromise;
  });

  (LazyComponent as typeof LazyComponent & { preload: () => void }).preload = () => {
    if (!factoryPromise) factoryPromise = factory();
  };

  return LazyComponent as typeof LazyComponent & { preload: () => void };
}
