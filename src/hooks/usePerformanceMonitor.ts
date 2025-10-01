import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  dataSize: number;
}

export const usePerformanceMonitor = (componentName: string, data?: any[]) => {
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    const renderTime = Date.now() - renderStartTime.current;
    const dataSize = data ? JSON.stringify(data).length : 0;

    const metrics: PerformanceMetrics = {
      loadTime,
      renderTime,
      dataSize
    };

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        ...metrics,
        loadTimeMs: `${loadTime}ms`,
        renderTimeMs: `${renderTime}ms`,
        dataSizeKB: `${(dataSize / 1024).toFixed(2)}KB`
      });
    }

    // You could send metrics to analytics service here
    // analyticsService.trackPerformance(componentName, metrics);
  }, [componentName, data]);

  const markRenderStart = () => {
    renderStartTime.current = Date.now();
  };

  return { markRenderStart };
};