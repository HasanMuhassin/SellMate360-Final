import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  MessageSquare,
  LogOut,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useSession, useProfile, useUpdateProfile, useSignOut } from '@/hooks/useAuth';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { useCustomerAddresses, useAddAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks/useCustomerAddresses';
import { useSupportTickets, useCreateTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/use-toast';

// Mock data removed - using database

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Mullaitivu', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

const orderStatusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-warning/10 text-warning' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-primary/10 text-primary' },
  processing: { label: 'Processing', icon: Package, className: 'bg-primary/10 text-primary' },
  packed: { label: 'Packed', icon: Package, className: 'bg-warning/10 text-warning' },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-success/10 text-success' },
  'out-for-delivery': { label: 'Out for Delivery', icon: Truck, className: 'bg-success/10 text-success' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-success/10 text-success' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, className: 'bg-destructive/10 text-destructive' },
};

const ticketStatusConfig = {
  open: { label: 'Open', className: 'bg-destructive/10 text-destructive' },
  'in-progress': { label: 'In Progress', className: 'bg-warning/10 text-warning' },
  resolved: { label: 'Resolved', className: 'bg-success/10 text-success' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-warning/10 text-warning' },
  high: { label: 'High', className: 'bg-destructive/10 text-destructive' },
};

export default function Account() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user, loading: sessionLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: customerOrders = [], isLoading: ordersLoading } = useCustomerOrders();
  const { data: addresses = [], isLoading: addressesLoading } = useCustomerAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const { data: tickets = [], isLoading: ticketsLoading } = useSupportTickets();
  const createTicket = useCreateTicket();
  const updateProfile = useUpdateProfile();
  const signOut = useSignOut();

  const [activeTab, setActiveTab] = useState('orders');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketOrderNumber, setTicketOrderNumber] = useState('');
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  // Address form state
  const [addrLabel, setAddrLabel] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
    }
  }, [profile]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/login');
    }
  }, [sessionLoading, session, navigate]);

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const resetAddressForm = () => {
    setAddrLabel('');
    setAddrDistrict('');
    setAddrCity('');
    setAddrStreet('');
    setAddrZip('');
    setAddrIsDefault(false);
    setEditingAddress(null);
  };

  const openAddressDialog = (address?: any) => {
    if (address) {
      setEditingAddress(address);
      setAddrLabel(address.label || '');
      setAddrDistrict(address.district || '');
      setAddrCity(address.city || '');
      setAddrStreet(address.street || '');
      setAddrZip(address.zip_code || '');
      setAddrIsDefault(address.is_default || false);
    } else {
      resetAddressForm();
    }
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    const addressData = {
      label: addrLabel || 'Home',
      district: addrDistrict,
      city: addrCity,
      street: addrStreet,
      zip_code: addrZip || undefined,
      is_default: addrIsDefault,
    };

    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({ id: editingAddress.id, ...addressData });
        toast({ title: 'Address updated', description: 'Your address has been updated.' });
      } else {
        await addAddress.mutateAsync(addressData);
        toast({ title: 'Address added', description: 'New address has been saved.' });
      }
      setIsAddressDialogOpen(false);
      resetAddressForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save address.', variant: 'destructive' });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast({ title: 'Address deleted', description: 'Address has been removed.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete address.', variant: 'destructive' });
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress.mutateAsync(id);
      toast({ title: 'Default updated', description: 'Default address has been changed.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to set default.', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });
      if (signInError) throw new Error('Current password is incorrect.');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change password.', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        name: profileName,
        phone: profilePhone,
      });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (sessionLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Don't render if no session (will redirect)
  if (!session) {
    return null;
  }

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayPhone = profile?.phone || 'No phone added';
  const displayEmail = user?.email || '';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/50 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your orders, addresses, and profile</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-foreground">{userInitial}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{displayName}</p>
                    <p className="text-sm text-muted-foreground truncate">{displayPhone}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {[
                    { id: 'orders', icon: Package, label: 'My Orders' },
                    { id: 'addresses', icon: MapPin, label: 'My Addresses' },
                    { id: 'profile', icon: User, label: 'Profile Settings' },
                    { id: 'support', icon: MessageSquare, label: 'Support Tickets' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        activeTab === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>

                <Separator className="my-4" />

                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                  disabled={signOut.isPending}
                >
                  {signOut.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Orders</h2>
                  <Badge variant="secondary">{customerOrders.length} orders</Badge>
                </div>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No orders yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start shopping to see your orders here
                      </p>
                      <Button asChild>
                        <Link to="/shop">Browse Products</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => {
                      const statusKey = order.order_status as keyof typeof orderStatusConfig;
                      const status = orderStatusConfig[statusKey] || orderStatusConfig.pending;
                      return (
                        <Card key={order.id}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{order.order_number}</span>
                                  <Badge className={cn('text-xs', status.className)}>
                                    <status.icon className="h-3 w-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(order.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/track-order?order=${order.order_number}`}>
                                    <Truck className="h-4 w-4 mr-1" />
                                    Track
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {item.product_name} × {item.quantity}
                                  </span>
                                  <span>{formatPrice(item.unit_price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>

                            <Separator className="my-4" />

                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span className="text-primary">{formatPrice(order.total)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Addresses</h2>
                  <Dialog open={isAddressDialogOpen} onOpenChange={(open) => {
                    setIsAddressDialogOpen(open);
                    if (!open) resetAddressForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openAddressDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </DialogTitle>
                        <DialogDescription>
                          Enter your delivery address details
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="addr-label">Label</Label>
                          <Input
                            id="addr-label"
                            placeholder="e.g., Home, Office"
                            className="mt-1"
                            value={addrLabel}
                            onChange={(e) => setAddrLabel(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="addr-street">Street Address *</Label>
                          <Textarea
                            id="addr-street"
                            placeholder="Enter your full street address"
                            className="mt-1"
                            value={addrStreet}
                            onChange={(e) => setAddrStreet(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="addr-district">District *</Label>
                            <Select value={addrDistrict} onValueChange={setAddrDistrict}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select district" />
                              </SelectTrigger>
                              <SelectContent>
                                {districts.map((district) => (
                                  <SelectItem key={district} value={district}>
                                    {district}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="addr-city">City *</Label>
                            <Input
                              id="addr-city"
                              placeholder="City"
                              className="mt-1"
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="addr-zip">ZIP Code</Label>
                          <Input
                            id="addr-zip"
                            placeholder="00000"
                            className="mt-1"
                            value={addrZip}
                            onChange={(e) => setAddrZip(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsAddressDialogOpen(false);
                          resetAddressForm();
                        }}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveAddress}
                          disabled={!addrStreet || !addrDistrict || !addrCity || addAddress.isPending || updateAddress.isPending}
                        >
                          {(addAddress.isPending || updateAddress.isPending) ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          {editingAddress ? 'Save Changes' : 'Add Address'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {addressesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : addresses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No addresses saved</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add a delivery address to speed up checkout
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <Card key={address.id} className={cn(address.is_default && 'border-primary')}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{address.label}</Badge>
                              {address.is_default && (
                                <Badge className="bg-primary text-primary-foreground text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openAddressDialog(address)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">{address.street}</p>
                            <p className="text-muted-foreground">
                              {address.city}, {address.district} {address.zip_code || ''}
                            </p>
                          </div>

                          {!address.is_default && (
                            <Button
                              variant="link"
                              size="sm"
                              className="px-0 mt-2"
                              onClick={() => handleSetDefaultAddress(address.id)}
                            >
                              Set as Default
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold">Profile Settings</h2>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profile-name">Full Name</Label>
                        <Input 
                          id="profile-name" 
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-phone">Phone Number</Label>
                        <Input 
                          id="profile-phone" 
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="mt-1" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="profile-email">Email Address</Label>
                      <Input 
                        id="profile-email" 
                        type="email" 
                        value={displayEmail}
                        disabled
                        className="mt-1 bg-muted" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Change Password</CardTitle>
                    <CardDescription>Update your password for security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="mt-1"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          className="mt-1"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          className="mt-1"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Update Password
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions for your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive">Delete Account</Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Support Tickets Tab */}
            {activeTab === 'support' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Support Tickets</h2>
                  <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                        <DialogDescription>
                          Describe your issue and we'll get back to you soon
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="ticket-order">Related Order (Optional)</Label>
                          <Select value={ticketOrderNumber} onValueChange={setTicketOrderNumber}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select an order" />
                            </SelectTrigger>
                            <SelectContent>
                              {customerOrders.map((order) => (
                                <SelectItem key={order.id} value={order.order_number}>
                                  {order.order_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ticket-subject">Subject *</Label>
                          <Input
                            id="ticket-subject"
                            placeholder="Brief description of your issue"
                            className="mt-1"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ticket-priority">Priority</Label>
                          <Select value={ticketPriority} onValueChange={setTicketPriority}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ticket-message">Message *</Label>
                          <Textarea
                            id="ticket-message"
                            placeholder="Describe your issue in detail..."
                            rows={4}
                            className="mt-1"
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTicketDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          disabled={!ticketSubject || !ticketMessage || createTicket.isPending}
                          onClick={async () => {
                            try {
                              await createTicket.mutateAsync({
                                subject: ticketSubject,
                                message: ticketMessage,
                                priority: ticketPriority,
                                order_number: ticketOrderNumber || undefined,
                              });
                              toast({ title: 'Ticket created', description: 'Your support ticket has been submitted.' });
                              setIsTicketDialogOpen(false);
                              setTicketSubject('');
                              setTicketMessage('');
                              setTicketPriority('medium');
                              setTicketOrderNumber('');
                            } catch (error: any) {
                              toast({ title: 'Error', description: error.message || 'Failed to create ticket.', variant: 'destructive' });
                            }
                          }}
                        >
                          {createTicket.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Submit Ticket
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {ticketsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tickets.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No support tickets</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Need help? Create a new support ticket
                      </p>
                      <Button onClick={() => setIsTicketDialogOpen(true)}>
                        Create Ticket
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => {
                      const status = ticketStatusConfig[ticket.status as keyof typeof ticketStatusConfig] || ticketStatusConfig.open;
                      const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                      return (
                        <Card key={ticket.id}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    {ticket.ticket_number}
                                  </span>
                                  <Badge className={cn('text-xs', status.className)}>
                                    {status.label}
                                  </Badge>
                                  <Badge variant="outline" className={cn('text-xs', priority.className)}>
                                    {priority.label}
                                  </Badge>
                                </div>
                                <h3 className="font-medium mb-1">{ticket.subject}</h3>
                                {ticket.order_number && (
                                  <p className="text-sm text-muted-foreground">
                                    Order: {ticket.order_number}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {ticket.message}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground text-right">
                                <p className="flex items-center gap-1 justify-end">
                                  <Clock className="h-3 w-3" />
                                  Created: {formatDate(ticket.created_at)}
                                </p>
                                <p>Updated: {formatDate(ticket.updated_at)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
