/**
 * Environment variable validation for deployment readiness
 */

interface EnvConfig {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_API_BASE_URL?: string;
  VITE_HYGRAPH_ENDPOINT?: string;
  VITE_HYGRAPH_TOKEN?: string;
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
  const env = import.meta.env as EnvConfig;
  const missing: string[] = [];
  const warnings: string[] = [];

  // Required Firebase config
  const requiredFirebaseVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  requiredFirebaseVars.forEach(varName => {
    if (!env[varName as keyof EnvConfig]) {
      missing.push(varName);
    }
  });

  // Optional but recommended
  if (!env.VITE_API_BASE_URL && import.meta.env.PROD) {
    warnings.push('VITE_API_BASE_URL not set - API calls may fail in production');
  }

  if (!env.VITE_HYGRAPH_ENDPOINT || !env.VITE_HYGRAPH_TOKEN) {
    warnings.push('Hygraph configuration missing - file uploads will use fallback methods');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Check deployment readiness
 */
export function checkDeploymentReadiness(): { ready: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check environment variables
  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    issues.push(`Missing required environment variables: ${envCheck.missing.join(', ')}`);
  }
  
  envCheck.warnings.forEach(warning => {
    issues.push(`Warning: ${warning}`);
  });

  // Check if running in production mode
  if (import.meta.env.DEV) {
    issues.push('Application is running in development mode');
  }

  // Check for debug code
  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    issues.push('React DevTools detected - ensure this is disabled in production');
  }

  // Check for console statements (basic check)
  const hasConsoleStatements = document.documentElement.innerHTML.includes('console.');
  if (hasConsoleStatements) {
    issues.push('Console statements detected in production build');
  }

  return {
    ready: issues.length === 0,
    issues
  };
}

/**
 * Security headers check (for deployment)
 */
export async function checkSecurityHeaders(): Promise<{ secure: boolean; missing: string[] }> {
  const missing: string[] = [];
  
  try {
    const response = await fetch(window.location.origin, { method: 'HEAD' });
    
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];
    
    requiredHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        missing.push(header);
      }
    });
  } catch (error) {
    missing.push('Unable to check security headers');
  }
  
  return {
    secure: missing.length === 0,
    missing
  };
}

/**
 * Performance audit
 */
export function performanceAudit(): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];
  let score = 100;

  // Check for performance API
  if (!('performance' in window)) {
    recommendations.push('Performance API not available');
    score -= 10;
  }

  // Check for service worker
  if (!('serviceWorker' in navigator)) {
    recommendations.push('Service Worker not supported - consider adding for offline functionality');
    score -= 5;
  }

  // Check for lazy loading support
  if (!('loading' in HTMLImageElement.prototype)) {
    recommendations.push('Native lazy loading not supported - consider polyfill');
    score -= 5;
  }

  // Check bundle size (basic estimation)
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const totalScripts = scripts.length;
  if (totalScripts > 10) {
    recommendations.push('Consider code splitting - many script files detected');
    score -= 10;
  }

  // Check for unused CSS (basic check)
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  if (stylesheets.length > 5) {
    recommendations.push('Consider CSS optimization - many stylesheets detected');
    score -= 5;
  }

  return { score: Math.max(0, score), recommendations };
}

/**
 * Initialize deployment checks
 */
export function initDeploymentChecks(): void {
  if (import.meta.env.PROD) {
    // Run checks in production
    const envCheck = validateEnvironment();
    const deploymentCheck = checkDeploymentReadiness();
    
    if (!envCheck.valid || !deploymentCheck.ready) {
      console.warn('Deployment issues detected:', {
        environment: envCheck,
        deployment: deploymentCheck
      });
    }
    
    // Run security headers check
    checkSecurityHeaders().then(securityCheck => {
      if (!securityCheck.secure) {
        console.warn('Security headers missing:', securityCheck.missing);
      }
    });
    
    // Run performance audit
    const perfAudit = performanceAudit();
    if (perfAudit.score < 80) {
      console.warn('Performance issues detected:', perfAudit.recommendations);
    }
  }
}