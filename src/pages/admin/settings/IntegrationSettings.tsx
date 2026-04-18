import { useState } from 'react';
import { Search, Link2, Unlink, Settings2, ExternalLink, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useIntegrations, useConnectIntegration, useDisconnectIntegration, type Integration } from '@/hooks/useIntegrations';

const statusIcons: Record<string, React.ReactNode> = {
  connected: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  pending: <Clock className="h-5 w-5 text-yellow-600" />,
  disconnected: <XCircle className="h-5 w-5 text-muted-foreground" />,
};

const statusColors: Record<string, string> = {
  connected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  disconnected: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function IntegrationSettingsPage() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [configureDialog, setConfigureDialog] = useState<Integration | null>(null);

  const categories = ['all', 'payment', 'shipping', 'marketing', 'analytics', 'communication'];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = (integration: Integration) => {
    connectMutation.mutate(
      { id: integration.id },
      {
        onSuccess: () => {
          toast.success(`${integration.name} connected successfully`);
          setConfigureDialog(null);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleDisconnect = (integration: Integration) => {
    disconnectMutation.mutate(integration.id, {
      onSuccess: () => toast.success(`${integration.name} disconnected`),
      onError: (err) => toast.error(err.message),
    });
  };

  const groupedByCategory = categories.slice(1).reduce((acc, category) => {
    acc[category] = filteredIntegrations.filter(i => i.category === category);
    return acc;
  }, {} as Record<string, Integration[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground">Connect third-party services to extend functionality</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" onValueChange={setCategoryFilter}>
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat === 'all' ? 'All' : cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-4">
          {Object.entries(groupedByCategory).map(([category, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold capitalize">{category}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map(integration => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onConfigure={() => setConfigureDialog(integration)}
                      onDisconnect={() => handleDisconnect(integration)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {categories.slice(1).map(category => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConfigure={() => setConfigureDialog(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!configureDialog} onOpenChange={() => setConfigureDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {configureDialog?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect this integration
            </DialogDescription>
          </DialogHeader>

          {configureDialog && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input id="apiKey" type="password" placeholder="Enter your API key" />
              </div>
              {configureDialog.category === 'payment' && (
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input id="secretKey" type="password" placeholder="Enter your secret key" />
                </div>
              )}
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">
                  Need help? Check the{' '}
                  <a href="#" className="text-primary hover:underline inline-flex items-center gap-1">
                    integration docs <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => configureDialog && handleConnect(configureDialog)}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationCard({
  integration,
  onConfigure,
  onDisconnect,
}: {
  integration: Integration;
  onConfigure: () => void;
  onDisconnect: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {statusIcons[integration.status]}
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <CardDescription className="text-xs capitalize">{integration.category}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className={statusColors[integration.status]}>
            {integration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{integration.description}</p>

        {integration.configured_at && (
          <p className="text-xs text-muted-foreground">
            Connected {format(new Date(integration.configured_at), 'MMM d, yyyy')}
          </p>
        )}

        <div className="flex gap-2">
          {integration.status === 'connected' ? (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={onConfigure}>
                <Settings2 className="mr-2 h-4 w-4" />
                Configure
              </Button>
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                <Unlink className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" className="flex-1" onClick={onConfigure}>
              <Link2 className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
