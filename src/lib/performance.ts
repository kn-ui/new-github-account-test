/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit rapid function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization with TTL (Time To Live)
 */
export class MemoCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  
  constructor(private ttl: number = 300000) {} // 5 minutes default
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Lazy loading utility for components
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
}

/**
 * Virtual scrolling helper for large lists
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems - 1, start + visibleCount + overscan * 2);
  
  return { start, end };
}

/**
 * Image lazy loading with intersection observer
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver;
  
  constructor(options?: IntersectionObserverInit) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            this.observer.unobserve(img);
          }
        }
      });
    }, options);
  }
  
  observe(element: HTMLImageElement): void {
    this.observer.observe(element);
  }
  
  disconnect(): void {
    this.observer.disconnect();
  }
}

/**
 * Bundle size analyzer helper
 */
export function analyzeBundle(): void {
  if (process.env.NODE_ENV === 'development') {
    // Only run in development
    const modules = (window as any).webpackChunkName || [];
    console.table(modules.map((m: any) => ({
      name: m.name,
      size: `${(m.size / 1024).toFixed(2)} KB`
    })));
  }
}

/**
 * Memory usage monitor
 */
export function monitorMemoryUsage(): void {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    });
  }
}

import React from 'react';