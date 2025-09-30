import React, { useState } from 'react';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SeedDatabase() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearFirst, setClearFirst] = useState(true);

  const append = (line: string) => setLogs((prev) => [...prev, line]);

  const call = async (endpoint: string) => {
    const url = `${(import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'}${endpoint}`;
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!resp.ok) throw new Error(`${endpoint} failed: ${resp.status}`);
    return resp.json();
  };

  const onSeed = async () => {
    setLoading(true); setError(null); setLogs([]);
    try {
      append('Starting database seeding...');
      if (clearFirst) {
        append('Clearing collections...');
        const out = await call('/api/dev/seed/clear');
        append(`Cleared: ${out?.data?.deleted ?? 0} documents`);
      }
      append('Seeding fresh data...');
      const out2 = await call(`/api/dev/seed/seed${clearFirst ? '' : '?clear=false'}`);
      append(out2.message || 'Seeding complete');
      append('Done.');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Development Seeder</CardTitle>
            <CardDescription>Clear and repopulate the Firestore database with consistent dev data. Disabled in production.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input id="clear" type="checkbox" checked={clearFirst} onChange={(e) => setClearFirst(e.target.checked)} />
                <label htmlFor="clear">Clear existing data first</label>
              </div>
              <Button onClick={onSeed} disabled={loading}>
                {loading ? 'Working...' : (clearFirst ? 'Clear and Seed' : 'Seed Without Clearing')}
              </Button>
              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="bg-muted rounded p-3 text-sm min-h-[120px] max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {logs.join('\n') || 'Logs will appear here...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

