import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Database, Loader2 } from 'lucide-react';

interface TestResult {
  table: string;
  status: 'success' | 'error' | 'loading';
  count?: number;
  error?: string;
}

export default function DatabaseTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const tables = ['products', 'categories', 'brands', 'customers', 'orders'];
    const testResults: TestResult[] = [];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          testResults.push({
            table,
            status: 'error',
            error: error.message,
          });
        } else {
          testResults.push({
            table,
            status: 'success',
            count: count ?? 0,
          });
        }
      } catch (err) {
        testResults.push({
          table,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    setResults(testResults);
    setConnectionStatus(
      testResults.every((r) => r.status === 'success') ? 'connected' : 'error'
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Testing connection to Supabase project: ztcgzbnuipjcifbtwzec
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {connectionStatus === 'loading' && (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span>Testing connection...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-green-600 font-medium">Connected Successfully</span>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-red-600 font-medium">Connection Issues Detected</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Results */}
        <Card>
          <CardHeader>
            <CardTitle>Table Query Results</CardTitle>
            <CardDescription>
              Testing SELECT access to core tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running tests...
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.table}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{result.table}</span>
                    </div>
                    <div>
                      {result.status === 'success' ? (
                        <Badge variant="secondary">{result.count} rows</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          {result.error}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {connectionStatus === 'connected' && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <p className="text-green-700">
                ✅ Your database is connected and accessible. You can now start using
                the React Query hooks to fetch and mutate data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
