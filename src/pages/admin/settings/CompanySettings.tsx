import { useRef, useState } from 'react';
import { Save, Upload, Globe, Building2, Phone, MapPin, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CLOUD_FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export default function CompanySettingsPage() {
  const {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    updateSettings,
    updateSocialLinks,
  } = useCompanySettings();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`${CLOUD_FUNCTIONS_URL}/manage-company-settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');

      updateSettings({ [type]: result.url });
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
    } catch (err: any) {
      console.error(`Failed to upload ${type}:`, err);
      toast.error(`Failed to upload ${type}: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PNG, JPG, WebP, ICO, SVG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB');
      return;
    }

    handleFileUpload(file, type);
    e.target.value = '';
  };

  const handleRemoveImage = (type: 'logo' | 'favicon') => {
    updateSettings({ [type]: '' });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Settings</h1>
          <p className="text-muted-foreground">Manage your store information and preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>Basic information about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input id="name" value={settings.name} onChange={e => updateSettings({ name: e.target.value })} placeholder="Your store name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input id="legalName" value={settings.legalName} onChange={e => updateSettings({ legalName: e.target.value })} placeholder="Registered business name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / TIN</Label>
                  <Input id="taxId" value={settings.taxId} onChange={e => updateSettings({ taxId: e.target.value })} placeholder="Tax identification number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input id="vatNumber" value={settings.vatNumber} onChange={e => updateSettings({ vatNumber: e.target.value })} placeholder="VAT registration number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderPrefix">Order Number Prefix</Label>
                <Input id="orderPrefix" value={settings.orderPrefix} onChange={e => updateSettings({ orderPrefix: e.target.value })} placeholder="e.g., ORD" className="w-32" />
                <p className="text-xs text-muted-foreground">
                  Orders will be numbered as {settings.orderPrefix}-000001, {settings.orderPrefix}-000002, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={settings.email} onChange={e => updateSettings({ email: e.target.value })} placeholder="info@yourstore.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={settings.phone} onChange={e => updateSettings({ phone: e.target.value })} placeholder="+94 11 234 5678" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input id="whatsapp" value={settings.whatsapp} onChange={e => updateSettings({ whatsapp: e.target.value })} placeholder="+94 77 123 4567" />
                <p className="text-xs text-muted-foreground">Used for the WhatsApp floating button and customer support</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
              <CardDescription>Your main business location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" value={settings.address} onChange={e => updateSettings({ address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={settings.city} onChange={e => updateSettings({ city: e.target.value })} placeholder="Colombo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" value={settings.postalCode} onChange={e => updateSettings({ postalCode: e.target.value })} placeholder="00300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={settings.country} onChange={e => updateSettings({ country: e.target.value })} placeholder="Sri Lanka" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Favicon</CardTitle>
              <CardDescription>Upload your store's visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hidden file inputs */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'logo')}
              />
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/x-icon,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'favicon')}
              />

              <div className="grid grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label>Store Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 relative overflow-hidden">
                      {uploadingLogo ? (
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      ) : settings.logo ? (
                        <>
                          <img src={settings.logo} alt="Logo" className="h-full w-full object-contain p-1" />
                          <button
                            onClick={() => handleRemoveImage('logo')}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        type="button"
                      >
                        {uploadingLogo ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <p className="text-xs text-muted-foreground">Recommended: 200x200px PNG/SVG</p>
                    </div>
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-4">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50 relative overflow-hidden">
                      {uploadingFavicon ? (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      ) : settings.favicon ? (
                        <>
                          <img src={settings.favicon} alt="Favicon" className="h-full w-full object-contain p-1" />
                          <button
                            onClick={() => handleRemoveImage('favicon')}
                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 hover:bg-destructive/90"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => faviconInputRef.current?.click()}
                        disabled={uploadingFavicon}
                        type="button"
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {uploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                      </Button>
                      <p className="text-xs text-muted-foreground">Recommended: 32x32px ICO/PNG</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL inputs as alternative */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Or paste Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.logo}
                    onChange={e => updateSettings({ logo: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Or paste Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    value={settings.favicon}
                    onChange={e => updateSettings({ favicon: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>Configure currency, timezone, and date formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={settings.currency} onValueChange={value => updateSettings({ currency: value })}>
                    <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LKR">LKR - Sri Lankan Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={settings.timezone} onValueChange={value => updateSettings({ timezone: value })}>
                    <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Colombo">Asia/Colombo (UTC+5:30)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={value => updateSettings({ dateFormat: value })}>
                    <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input id="facebook" value={settings.socialLinks.facebook || ''} onChange={e => updateSocialLinks('facebook', e.target.value)} placeholder="https://facebook.com/yourpage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" value={settings.socialLinks.instagram || ''} onChange={e => updateSocialLinks('instagram', e.target.value)} placeholder="https://instagram.com/yourpage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter / X</Label>
                  <Input id="twitter" value={settings.socialLinks.twitter || ''} onChange={e => updateSocialLinks('twitter', e.target.value)} placeholder="https://twitter.com/yourpage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input id="youtube" value={settings.socialLinks.youtube || ''} onChange={e => updateSocialLinks('youtube', e.target.value)} placeholder="https://youtube.com/yourchannel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <Input id="tiktok" value={settings.socialLinks.tiktok || ''} onChange={e => updateSocialLinks('tiktok', e.target.value)} placeholder="https://tiktok.com/@yourpage" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
