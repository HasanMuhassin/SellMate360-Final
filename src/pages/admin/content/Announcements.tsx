import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, MoreVertical, Edit, Trash2, Bell, BellOff, Eye, Megaphone, ArrowUp, ArrowDown, ExternalLink, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '@/components/admin/StatCard';
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, AnnouncementRow } from '@/hooks/useContent';

const targetPageOptions = [
  { value: 'all', label: 'All Pages' },
  { value: 'home', label: 'Homepage' },
  { value: 'shop', label: 'Shop' },
  { value: 'product', label: 'Product Pages' },
  { value: 'cart', label: 'Cart' },
  { value: 'checkout', label: 'Checkout' },
];

const colorPresets = [
  { bg: 'hsl(var(--primary))', text: 'hsl(var(--primary-foreground))', name: 'Primary' },
  { bg: 'hsl(142 76% 36%)', text: 'hsl(0 0% 100%)', name: 'Success' },
  { bg: 'hsl(25 95% 53%)', text: 'hsl(0 0% 100%)', name: 'Warning' },
  { bg: 'hsl(0 84% 60%)', text: 'hsl(0 0% 100%)', name: 'Danger' },
  { bg: 'hsl(221 83% 53%)', text: 'hsl(0 0% 100%)', name: 'Info' },
  { bg: 'hsl(270 76% 50%)', text: 'hsl(0 0% 100%)', name: 'Purple' },
];

export default function Announcements() {
  const { toast } = useToast();
  const { data: announcements = [], isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementRow | null>(null);

  const [formData, setFormData] = useState({
    message: '',
    link: '',
    link_text: '',
    background_color: colorPresets[0].bg,
    text_color: colorPresets[0].text,
    position: 'top' as string,
    show_close_button: true,
    starts_at: '',
    ends_at: '',
    is_active: true,
    priority: 1,
    target_pages: ['all'] as string[],
  });

  const stats = {
    total: announcements.length,
    active: announcements.filter((a) => a.is_active).length,
    scheduled: announcements.filter((a) => !a.is_active && new Date(a.starts_at) > new Date()).length,
    expired: announcements.filter((a) => a.ends_at && new Date(a.ends_at) < new Date()).length,
  };

  const handleOpenDialog = (announcement?: AnnouncementRow) => {
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setFormData({
        message: announcement.message,
        link: announcement.link || '',
        link_text: announcement.link_text || '',
        background_color: announcement.background_color,
        text_color: announcement.text_color,
        position: announcement.position,
        show_close_button: announcement.show_close_button,
        starts_at: announcement.starts_at ? format(new Date(announcement.starts_at), "yyyy-MM-dd'T'HH:mm") : '',
        ends_at: announcement.ends_at ? format(new Date(announcement.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
        is_active: announcement.is_active,
        priority: announcement.priority,
        target_pages: announcement.target_pages || ['all'],
      });
    } else {
      setSelectedAnnouncement(null);
      setFormData({
        message: '', link: '', link_text: '',
        background_color: colorPresets[0].bg, text_color: colorPresets[0].text,
        position: 'top', show_close_button: true,
        starts_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), ends_at: '',
        is_active: true, priority: 1, target_pages: ['all'],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.message) {
      toast({ title: 'Validation Error', description: 'Please enter an announcement message.', variant: 'destructive' });
      return;
    }
    const payload = {
      ...formData,
      link: formData.link || null,
      link_text: formData.link_text || null,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : new Date().toISOString(),
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    };
    try {
      if (selectedAnnouncement) {
        await updateAnnouncement.mutateAsync({ id: selectedAnnouncement.id, ...payload });
        toast({ title: 'Announcement Updated', description: 'The announcement has been updated successfully.' });
      } else {
        await createAnnouncement.mutateAsync(payload);
        toast({ title: 'Announcement Created', description: 'The announcement has been created successfully.' });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (announcement: AnnouncementRow) => {
    try {
      await deleteAnnouncement.mutateAsync(announcement.id);
      toast({ title: 'Announcement Deleted', description: 'The announcement has been deleted.', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (announcement: AnnouncementRow) => {
    try {
      await updateAnnouncement.mutateAsync({ id: announcement.id, is_active: !announcement.is_active });
      toast({
        title: announcement.is_active ? 'Announcement Deactivated' : 'Announcement Activated',
        description: `The announcement is now ${announcement.is_active ? 'hidden' : 'visible'}.`,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleTargetPageChange = (value: string, checked: boolean) => {
    if (value === 'all') {
      setFormData({ ...formData, target_pages: checked ? ['all'] : [] });
    } else {
      const newPages = checked
        ? [...formData.target_pages.filter((p) => p !== 'all'), value]
        : formData.target_pages.filter((p) => p !== value);
      setFormData({ ...formData, target_pages: newPages });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">Manage site-wide announcement banners</p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Announcement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Announcements" value={stats.total.toString()} icon={Megaphone} description="All banners" />
        <StatCard title="Active" value={stats.active.toString()} icon={Bell} description="Currently visible" />
        <StatCard title="Scheduled" value={stats.scheduled.toString()} icon={Calendar} description="Upcoming" />
        <StatCard title="Expired" value={stats.expired.toString()} icon={BellOff} description="Past end date" />
      </div>

      {announcements.some((a) => a.is_active) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Eye className="h-5 w-5" />Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.filter((a) => a.is_active).sort((a, b) => a.priority - b.priority).map((a) => (
              <div key={a.id} className="py-3 px-4 rounded-lg text-center text-sm font-medium" style={{ backgroundColor: a.background_color, color: a.text_color }}>
                {a.message}
                {a.link && <span className="ml-2 underline cursor-pointer">{a.link_text || 'Learn More'}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Target Pages</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <Switch checked={announcement.is_active} onCheckedChange={() => handleToggleActive(announcement)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: announcement.background_color }} />
                      <div>
                        <div className="font-medium max-w-md truncate">{announcement.message}</div>
                        {announcement.link && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {announcement.link_text || announcement.link}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {announcement.position === 'top' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {announcement.position}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(announcement.target_pages || []).includes('all') ? (
                        <Badge variant="secondary" className="text-xs">All Pages</Badge>
                      ) : (
                        (announcement.target_pages || []).slice(0, 2).map((page) => (
                          <Badge key={page} variant="outline" className="text-xs capitalize">{page}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(announcement.starts_at), 'MMM dd, yyyy')}</div>
                      {announcement.ends_at && (
                        <div className="text-xs text-muted-foreground">to {format(new Date(announcement.ends_at), 'MMM dd, yyyy')}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{announcement.priority}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(announcement)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(announcement)}>
                          {announcement.is_active ? <><BellOff className="h-4 w-4 mr-2" />Deactivate</> : <><Bell className="h-4 w-4 mr-2" />Activate</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(announcement)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="py-3 px-4 rounded-lg text-center text-sm font-medium" style={{ backgroundColor: formData.background_color, color: formData.text_color }}>
                {formData.message || 'Your announcement message will appear here...'}
                {formData.link && <span className="ml-2 underline">{formData.link_text || 'Learn More'}</span>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Announcement Message *</Label>
              <Input id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="🎉 Free delivery on orders above Rs.5,000!" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="link">Link URL (optional)</Label>
                <Input id="link" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} placeholder="/shop" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkText">Link Text</Label>
                <Input id="linkText" value={formData.link_text} onChange={(e) => setFormData({ ...formData, link_text: e.target.value })} placeholder="Shop Now" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Preset</Label>
              <div className="flex gap-2 flex-wrap">
                {colorPresets.map((preset) => (
                  <button key={preset.name} type="button" className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${formData.background_color === preset.bg ? 'border-foreground scale-105' : 'border-transparent'}`} style={{ backgroundColor: preset.bg, color: preset.text }} onClick={() => setFormData({ ...formData, background_color: preset.bg, text_color: preset.text })}>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })} min={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input id="startsAt" type="datetime-local" value={formData.starts_at} onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">End Date (optional)</Label>
                <Input id="endsAt" type="datetime-local" value={formData.ends_at} onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Pages</Label>
              <div className="grid grid-cols-3 gap-2">
                {targetPageOptions.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <Checkbox id={`page-${opt.value}`} checked={formData.target_pages.includes(opt.value)} onCheckedChange={(checked) => handleTargetPageChange(opt.value, !!checked)} />
                    <label htmlFor={`page-${opt.value}`} className="text-sm">{opt.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Close Button</Label>
                <p className="text-xs text-muted-foreground">Allow users to dismiss</p>
              </div>
              <Switch checked={formData.show_close_button} onCheckedChange={(checked) => setFormData({ ...formData, show_close_button: checked })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Show on website</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createAnnouncement.isPending || updateAnnouncement.isPending}>
              {selectedAnnouncement ? 'Update' : 'Create'} Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
