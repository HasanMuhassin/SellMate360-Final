import { useState } from 'react';
import { Plus, Search, Mail, MessageCircle, Smartphone, Edit, Copy, Eye, MoreHorizontal, Variable, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNotificationTemplates, NotificationTemplate } from '@/hooks/useStoreSettings';

const typeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  sms: <Smartphone className="h-4 w-4" />,
};

const triggerLabels: Record<string, string> = {
  order_placed: 'Order Placed',
  order_shipped: 'Order Shipped',
  order_delivered: 'Order Delivered',
  password_reset: 'Password Reset',
  low_stock: 'Low Stock Alert',
  reseller_approved: 'Reseller Approved',
  payout_processed: 'Payout Processed',
};

export default function NotificationSettingsPage() {
  const { templates, isLoading, upsertTemplate, toggleStatus, deleteTemplate } = useNotificationTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<NotificationTemplate> | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>('email');
  const [formTrigger, setFormTrigger] = useState<string>('order_placed');
  const [formSubject, setFormSubject] = useState('');
  const [formContent, setFormContent] = useState('');

  const filteredTemplates = templates.filter(n => {
    const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormType('email');
    setFormTrigger('order_placed');
    setFormSubject('');
    setFormContent('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (t: NotificationTemplate) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormType(t.type);
    setFormTrigger(t.trigger_event);
    setFormSubject(t.subject || '');
    setFormContent(t.content);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertTemplate({
      ...(editingTemplate?.id ? { id: editingTemplate.id } : {}),
      name: formName,
      type: formType as any,
      trigger_event: formTrigger,
      subject: formSubject || null,
      content: formContent,
      variables: formContent.match(/\{(\w+)\}/g)?.map(v => v.slice(1, -1)) || [],
    });
    setIsSaving(false);
    if (result) setIsDialogOpen(false);
  };

  const handleDuplicate = async (t: NotificationTemplate) => {
    await upsertTemplate({
      name: `${t.name} (Copy)`,
      type: t.type,
      trigger_event: t.trigger_event,
      subject: t.subject,
      content: t.content,
      variables: t.variables,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notification Templates</h1>
          <p className="text-muted-foreground">Manage email, WhatsApp, and SMS notification templates</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Channel Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search templates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-6 w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredTemplates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No templates found</TableCell>
                    </TableRow>
                  ) : (
                    filteredTemplates.map(template => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div className="font-medium">{template.name}</div>
                          {template.subject && <div className="text-sm text-muted-foreground truncate max-w-xs">{template.subject}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeIcons[template.type]}
                            <span className="capitalize">{template.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{triggerLabels[template.trigger_event] || template.trigger_event}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch checked={template.status === 'active'} onCheckedChange={() => toggleStatus(template.id, template.status === 'active' ? 'inactive' : 'active')} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(template.updated_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setPreviewTemplate(template); setPreviewOpen(true); }}>
                                <Eye className="mr-2 h-4 w-4" />Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(template)}>
                                <Edit className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                <Copy className="mr-2 h-4 w-4" />Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteTemplate(template.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email</CardTitle>
                <CardDescription>Configure email sending settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>From Name</Label><Input defaultValue="SellMate360" /></div>
                <div className="space-y-2"><Label>From Email</Label><Input defaultValue="noreply@sellmate360.lk" /></div>
                <div className="flex items-center justify-between"><Label>Enabled</Label><Switch defaultChecked /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" />WhatsApp</CardTitle>
                <CardDescription>WhatsApp Business API settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Phone Number</Label><Input defaultValue="+94 77 123 4567" /></div>
                <div className="flex items-center justify-between"><Label>Enabled</Label><Switch defaultChecked /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />SMS</CardTitle>
                <CardDescription>SMS gateway configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Sender ID</Label><Input defaultValue="SELLMATE" /></div>
                <div className="flex items-center justify-between"><Label>Enabled</Label><Switch defaultChecked /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>Configure your notification template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., Order Confirmation" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trigger Event</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_placed">Order Placed</SelectItem>
                  <SelectItem value="order_shipped">Order Shipped</SelectItem>
                  <SelectItem value="order_delivered">Order Delivered</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="low_stock">Low Stock Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject (Email only)</Label>
              <Input value={formSubject} onChange={e => setFormSubject(e.target.value)} placeholder="Order #{order_number} Confirmed!" />
            </div>
            <div className="space-y-2">
              <Label>Message Content</Label>
              <Textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Enter your message template..." rows={10} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Variable className="h-4 w-4" />Available Variables</Label>
              <div className="flex flex-wrap gap-2">
                {['customer_name', 'order_number', 'order_total', 'currency', 'store_name', 'tracking_url', 'delivery_city'].map(v => (
                  <Badge key={v} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => { navigator.clipboard.writeText(`{${v}}`); toast.success(`Copied {${v}}`); }}>
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !formName || !formContent}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Preview with sample data</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                {typeIcons[previewTemplate.type]}
                <span className="font-medium capitalize">{previewTemplate.type}</span>
              </div>
              {previewTemplate.subject && (
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="font-medium">{previewTemplate.subject.replace(/\{(\w+)\}/g, (_, v) => `[${v}]`)}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Message</Label>
                <div className="mt-2 p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                  {previewTemplate.content.replace(/\{(\w+)\}/g, (_, v) => `[${v}]`)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
