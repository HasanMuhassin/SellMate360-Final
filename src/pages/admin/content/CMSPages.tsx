import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Search, MoreVertical, Edit, Trash2, Eye, FileText, Globe, Layout, ExternalLink, Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '@/components/admin/StatCard';
import { useCMSPages, useCreateCMSPage, useUpdateCMSPage, useDeleteCMSPage, CMSPageRow } from '@/hooks/useContent';

export default function CMSPages() {
  const { toast } = useToast();
  const { data: pages = [], isLoading } = useCMSPages();
  const createPage = useCreateCMSPage();
  const updatePage = useUpdateCMSPage();
  const deletePage = useDeleteCMSPage();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<CMSPageRow | null>(null);
  const [activeTab, setActiveTab] = useState('content');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    show_in_footer: false,
    show_in_menu: false,
    menu_position: 0,
    status: 'draft' as string,
  });

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === 'published').length,
    draft: pages.filter((p) => p.status === 'draft').length,
    inFooter: pages.filter((p) => p.show_in_footer).length,
  };

  const handleOpenDialog = (page?: CMSPageRow) => {
    if (page) {
      setSelectedPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        meta_keywords: page.meta_keywords || '',
        show_in_footer: page.show_in_footer,
        show_in_menu: page.show_in_menu,
        menu_position: page.menu_position,
        status: page.status,
      });
    } else {
      setSelectedPage(null);
      setFormData({
        title: '', slug: '', content: '', meta_title: '', meta_description: '', meta_keywords: '',
        show_in_footer: false, show_in_menu: false, menu_position: 0, status: 'draft',
      });
    }
    setActiveTab('content');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    try {
      if (selectedPage) {
        await updatePage.mutateAsync({ id: selectedPage.id, ...formData });
        toast({ title: 'Page Updated', description: `"${formData.title}" has been updated successfully.` });
      } else {
        await createPage.mutateAsync(formData);
        toast({ title: 'Page Created', description: `"${formData.title}" has been created successfully.` });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (page: CMSPageRow) => {
    try {
      await deletePage.mutateAsync(page.id);
      toast({ title: 'Page Deleted', description: `"${page.title}" has been deleted.`, variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDuplicate = async (page: CMSPageRow) => {
    try {
      await createPage.mutateAsync({
        ...page,
        title: `${page.title} (Copy)`,
        slug: `${page.slug}-copy`,
        status: 'draft',
      });
      toast({ title: 'Page Duplicated', description: `"${page.title}" has been duplicated.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
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
          <h1 className="text-2xl font-bold text-foreground">CMS Pages</h1>
          <p className="text-muted-foreground">Manage website pages and content</p>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Pages" value={stats.total.toString()} icon={FileText} description="All CMS pages" />
        <StatCard title="Published" value={stats.published.toString()} icon={Globe} description="Live on website" />
        <StatCard title="Drafts" value={stats.draft.toString()} icon={Edit} description="Not published" />
        <StatCard title="In Footer" value={stats.inFooter.toString()} icon={Layout} description="Shown in footer" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search pages..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
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
                <TableHead>Page Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Display</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="font-medium">{page.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">{page.meta_description}</div>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-2 py-1 rounded">/{page.slug}</code></TableCell>
                  <TableCell><Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{page.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {page.show_in_menu && <Badge variant="outline" className="text-xs">Menu</Badge>}
                      {page.show_in_footer && <Badge variant="outline" className="text-xs">Footer</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(page.updated_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(page)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Preview</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(page)}><Copy className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                        <DropdownMenuItem><ExternalLink className="h-4 w-4 mr-2" />View Live</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(page)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPage ? 'Edit Page' : 'Create New Page'}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title *</Label>
                  <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: formData.slug || generateSlug(e.target.value) })} placeholder="e.g., About Us" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">/</span>
                    <Input id="slug" className="rounded-l-none" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="about-us" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Page Content *</Label>
                <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Enter page content (HTML supported)..." rows={12} />
                <p className="text-xs text-muted-foreground">You can use HTML tags for formatting.</p>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} placeholder="SEO title for search engines" />
                <p className="text-xs text-muted-foreground">{formData.meta_title.length}/60 characters recommended</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea id="metaDescription" value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} placeholder="Brief description for search results" rows={3} />
                <p className="text-xs text-muted-foreground">{formData.meta_description.length}/160 characters recommended</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input id="metaKeywords" value={formData.meta_keywords} onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" />
              </div>
              <Card className="bg-muted/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Search Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="text-blue-600 text-lg hover:underline cursor-pointer">{formData.meta_title || formData.title || 'Page Title'}</div>
                    <div className="text-green-700 text-sm">sellmate360.lk/{formData.slug || 'page-url'}</div>
                    <div className="text-sm text-muted-foreground">{formData.meta_description || 'Page description will appear here...'}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show in Navigation Menu</Label>
                    <p className="text-xs text-muted-foreground">Display this page in the main navigation</p>
                  </div>
                  <Switch checked={formData.show_in_menu} onCheckedChange={(checked) => setFormData({ ...formData, show_in_menu: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show in Footer</Label>
                    <p className="text-xs text-muted-foreground">Display this page link in the footer</p>
                  </div>
                  <Switch checked={formData.show_in_footer} onCheckedChange={(checked) => setFormData({ ...formData, show_in_footer: checked })} />
                </div>
                {formData.show_in_menu && (
                  <div className="space-y-2">
                    <Label htmlFor="menuPosition">Menu Position</Label>
                    <Input id="menuPosition" type="number" value={formData.menu_position} onChange={(e) => setFormData({ ...formData, menu_position: parseInt(e.target.value) || 0 })} min={0} />
                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createPage.isPending || updatePage.isPending}>
              {selectedPage ? 'Update Page' : 'Create Page'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
