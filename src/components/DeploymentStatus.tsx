import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { validateEnvironment, checkDeploymentReadiness, checkSecurityHeaders, performanceAudit } from '@/lib/env-validation';
import { cleanupOldActivityLogs } from '@/scripts/cleanup-activity-logs';
import { toast } from 'sonner';

interface DeploymentStatusProps {
  className?: string;
}

export default function DeploymentStatus({ className }: DeploymentStatusProps) {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [performanceStatus, setPerformanceStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const runChecks = async () => {
    setLoading(true);
    
    try {
      // Environment validation
      const env = validateEnvironment();
      setEnvStatus(env);
      
      // Deployment readiness
      const deployment = checkDeploymentReadiness();
      setDeploymentStatus(deployment);
      
      // Security headers
      const security = await checkSecurityHeaders();
      setSecurityStatus(security);
      
      // Performance audit
      const performance = performanceAudit();
      setPerformanceStatus(performance);
    } catch (error) {
      console.error('Failed to run deployment checks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupLogs = async () => {
    setCleanupLoading(true);
    try {
      const result = await cleanupOldActivityLogs();
      if (result.success) {
        toast.success(`Cleaned up ${result.deletedCount} old activity log entries`);
      } else {
        toast.error(`Failed to cleanup logs: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to cleanup activity logs');
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Checking Deployment Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Deployment Status</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runChecks}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCleanupLogs}
            disabled={cleanupLoading}
          >
            {cleanupLoading ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              'Cleanup Logs'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Environment Configuration
              {getStatusBadge(envStatus?.valid, envStatus?.valid ? 'Valid' : 'Issues')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {envStatus?.missing?.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium text-red-600">Missing Variables:</p>
                <ul className="text-xs text-red-600 ml-4">
                  {envStatus.missing.map((variable: string) => (
                    <li key={variable}>• {variable}</li>
                  ))}
                </ul>
              </div>
            )}
            {envStatus?.warnings?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-600">Warnings:</p>
                <ul className="text-xs text-yellow-600 ml-4">
                  {envStatus.warnings.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
            {envStatus?.valid && envStatus?.warnings?.length === 0 && (
              <p className="text-sm text-green-600">All environment variables configured correctly</p>
            )}
          </CardContent>
        </Card>

        {/* Deployment Readiness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Deployment Readiness
              {getStatusBadge(deploymentStatus?.ready, deploymentStatus?.ready ? 'Ready' : 'Issues')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deploymentStatus?.issues?.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1">
                {deploymentStatus.issues.map((issue: string, index: number) => (
                  <li key={index} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600">Application ready for deployment</p>
            )}
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Security Headers
              {getStatusBadge(securityStatus?.secure, securityStatus?.secure ? 'Secure' : 'Missing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {securityStatus?.missing?.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-red-600">Missing Headers:</p>
                <ul className="text-xs text-red-600 ml-4">
                  {securityStatus.missing.map((header: string) => (
                    <li key={header}>• {header}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-green-600">All security headers present</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Performance Audit
              <Badge variant={performanceStatus?.score >= 80 ? 'default' : 'secondary'}>
                Score: {performanceStatus?.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceStatus?.recommendations?.length > 0 ? (
              <ul className="text-xs text-gray-600 space-y-1">
                {performanceStatus.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600">No performance issues detected</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}