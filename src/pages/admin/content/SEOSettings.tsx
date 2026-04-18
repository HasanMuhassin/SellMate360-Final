import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Globe, Code, Image, Edit, Save, Home, ShoppingBag, Package, Grid, CreditCard, FileText, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '@/components/admin/StatCard';
import { useSEOSettings, useUpdateSEOSetting, SEOSettingRow } from '@/hooks/useContent';

const pageTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home, shop: ShoppingBag, product: Package, category: Grid, checkout: CreditCard, custom: FileText,
};

export default function SEOSettingsPage() {
  const { toast } = useToast();
  const { data: settings = [], isLoading } = useSEOSettings();
  const updateSetting = useUpdateSEOSetting();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SEOSettingRow | null>(null);

  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    robots_directive: 'index,follow',
    structured_data: '',
  });

  const handleEdit = (setting: SEOSettingRow) => {
    setSelectedSetting(setting);
    setFormData({
      meta_title: setting.meta_title || '',
      meta_description: setting.meta_description || '',
      meta_keywords: setting.meta_keywords || '',
      og_title: setting.og_title || '',
      og_description: setting.og_description || '',
      og_image: setting.og_image || '',
      canonical_url: setting.canonical_url || '',
      robots_directive: setting.robots_directive || 'index,follow',
      structured_data: setting.structured_data || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedSetting) return;
    try {
      await updateSetting.mutateAsync({ id: selectedSetting.id, ...formData });
      toast({ title: 'SEO Settings Updated', description: `Settings for "${selectedSetting.page_name}" have been saved.` });
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getSEOScore = (setting: SEOSettingRow): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;
    const mt = setting.meta_title || '';
    const md = setting.meta_description || '';
    if (mt.length < 30 || mt.length > 60) { issues.push('Meta title should be 30-60 characters'); score -= 15; }
    if (md.length < 120 || md.length > 160) { issues.push('Meta description should be 120-160 characters'); score -= 15; }
    if (!setting.og_title) { issues.push('Missing Open Graph title'); score -= 10; }
    if (!setting.og_description) { issues.push('Missing Open Graph description'); score -= 10; }
    if (!setting.og_image) { issues.push('Missing Open Graph image'); score -= 10; }
    if (!setting.canonical_url) { issues.push('Missing canonical URL'); score -= 10; }
    if (!setting.structured_data) { issues.push('Missing structured data'); score -= 10; }
    return { score: Math.max(0, score), issues };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageScore = settings.length > 0
    ? Math.round(settings.reduce((acc, s) => acc + getSEOScore(s).score, 0) / settings.length)
    : 0;

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
          <h1 className="text-2xl font-bold text-foreground">SEO Settings</h1>
          <p className="text-muted-foreground">Manage search engine optimization for all pages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Page Templates" value={settings.length.toString()} icon={Globe} description="SEO configurations" />
        <StatCard title="Avg SEO Score" value={`${averageScore}%`} icon={Search} description={averageScore >= 80 ? 'Good health' : 'Needs improvement'} />
        <StatCard title="Indexed Pages" value={settings.filter((s) => (s.robots_directive || '').includes('index') && !(s.robots_directive || '').startsWith('noindex')).length.toString()} icon={CheckCircle} description="Visible to search" />
        <StatCard title="Hidden Pages" value={settings.filter((s) => (s.robots_directive || '').includes('noindex')).length.toString()} icon={AlertTriangle} description="Not indexed" />
      </div>

      <div className="grid gap-4">
        {settings.map((setting) => {
          const Icon = pageTypeIcons[setting.page_type] || FileText;
          const { score, issues } = getSEOScore(setting);

          return (
            <Card key={setting.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <CardTitle className="text-lg">{setting.page_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{setting.page_type}</Badge>
                        <span>•</span>
                        <span>Updated {format(new Date(setting.updated_at), 'MMM dd, yyyy')}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</div>
                      <div className="text-xs text-muted-foreground">SEO Score</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>
                      <Edit className="h-4 w-4 mr-2" />Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="details" className="border-none">
                    <AccordionTrigger className="py-2 text-sm">View Details & Issues ({issues.length})</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Current Settings</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Title: </span><span className="font-medium">{setting.meta_title}</span><span className="text-xs text-muted-foreground ml-2">({(setting.meta_title || '').length} chars)</span></div>
                            <div><span className="text-muted-foreground">Description: </span><span>{(setting.meta_description || '').substring(0, 80)}...</span><span className="text-xs text-muted-foreground ml-2">({(setting.meta_description || '').length} chars)</span></div>
                            <div><span className="text-muted-foreground">Robots: </span><code className="bg-muted px-1 rounded text-xs">{setting.robots_directive}</code></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">{issues.length > 0 ? 'Issues to Fix' : 'All Checks Passed'}</h4>
                          {issues.length > 0 ? (
                            <ul className="space-y-1">
                              {issues.map((issue, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-amber-600"><AlertTriangle className="h-3 w-3" />{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="h-4 w-4" />All SEO checks passed</div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SEO Settings - {selectedSetting?.page_name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="meta">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="meta"><Search className="h-4 w-4 mr-2" />Meta Tags</TabsTrigger>
              <TabsTrigger value="og"><Image className="h-4 w-4 mr-2" />Open Graph</TabsTrigger>
              <TabsTrigger value="advanced"><Globe className="h-4 w-4 mr-2" />Advanced</TabsTrigger>
              <TabsTrigger value="schema"><Code className="h-4 w-4 mr-2" />Schema</TabsTrigger>
            </TabsList>

            <TabsContent value="meta" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input id="metaTitle" value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} placeholder="Page title for search engines" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Recommended: 30-60 characters</span>
                  <span className={formData.meta_title.length > 60 ? 'text-red-500' : ''}>{formData.meta_title.length}/60</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea id="metaDescription" value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} placeholder="Brief description for search results" rows={3} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Recommended: 120-160 characters</span>
                  <span className={formData.meta_description.length > 160 ? 'text-red-500' : ''}>{formData.meta_description.length}/160</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input id="metaKeywords" value={formData.meta_keywords} onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" />
                <p className="text-xs text-muted-foreground">Use template variables like {'{product_name}'}, {'{category}'} for dynamic pages</p>
              </div>
              <Card className="bg-muted/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Google Search Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="text-blue-600 text-lg hover:underline cursor-pointer">{formData.meta_title || 'Page Title'}</div>
                    <div className="text-green-700 text-sm">{formData.canonical_url || 'sellmate360.lk/page'}</div>
                    <div className="text-sm text-muted-foreground">{formData.meta_description || 'Page description will appear here...'}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="og" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input id="ogTitle" value={formData.og_title} onChange={(e) => setFormData({ ...formData, og_title: e.target.value })} placeholder="Title for social sharing" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea id="ogDescription" value={formData.og_description} onChange={(e) => setFormData({ ...formData, og_description: e.target.value })} placeholder="Description for social sharing" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input id="ogImage" value={formData.og_image} onChange={(e) => setFormData({ ...formData, og_image: e.target.value })} placeholder="/images/og-image.jpg" />
                <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>
              </div>
              <Card className="bg-muted/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Social Share Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden max-w-md">
                    <div className="bg-muted h-32 flex items-center justify-center">
                      {formData.og_image ? <span className="text-xs text-muted-foreground">{formData.og_image}</span> : <Image className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <div className="p-3 bg-card">
                      <div className="text-xs text-muted-foreground uppercase">sellmate360.lk</div>
                      <div className="font-medium">{formData.og_title || 'OG Title'}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">{formData.og_description || 'OG description will appear here...'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input id="canonicalUrl" value={formData.canonical_url} onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })} placeholder="https://sellmate360.lk/page" />
                <p className="text-xs text-muted-foreground">Use template variables like {'{slug}'} for dynamic pages</p>
              </div>
              <div className="space-y-2">
                <Label>Robots Directive</Label>
                <Select value={formData.robots_directive} onValueChange={(value) => setFormData({ ...formData, robots_directive: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="index,follow">index, follow (Recommended)</SelectItem>
                    <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                    <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                    <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Controls how search engines crawl and index this page</p>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="structuredData">Structured Data (JSON-LD)</Label>
                <Textarea id="structuredData" value={formData.structured_data} onChange={(e) => setFormData({ ...formData, structured_data: e.target.value })} placeholder='{"@context":"https://schema.org","@type":"WebPage"}' rows={10} className="font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Enter valid JSON-LD schema markup for rich snippets in search results</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateSetting.isPending}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
