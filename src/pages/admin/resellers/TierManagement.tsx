import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Users,
  Percent,
  DollarSign,
  Truck,
  HeadphonesIcon,
  Edit,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useResellerTierBenefits, useUpdateTierBenefit, useAdminResellers } from '@/hooks/useAdminResellers';
import { toast } from 'sonner';
import type { ResellerTierBenefit, ResellerTier } from '@/types/database';

const tierColors: Record<ResellerTier, {
  bg: string;
  border: string;
  text: string;
  icon: string;
}> = {
  silver: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-100 to-amber-200',
    border: 'border-yellow-400',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
  },
  platinum: {
    bg: 'bg-gradient-to-br from-purple-100 to-indigo-200',
    border: 'border-purple-400',
    text: 'text-purple-800',
    icon: 'text-purple-600',
  },
};

const tierNames: Record<ResellerTier, string> = {
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

export default function TierManagement() {
  const { data: tiers, isLoading, error } = useResellerTierBenefits();
  const { data: resellers } = useAdminResellers();
  const updateTierBenefit = useUpdateTierBenefit();
  
  const [editingTier, setEditingTier] = useState<ResellerTierBenefit | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Count resellers per tier
  const resellerCounts: Record<ResellerTier, number> = {
    silver: resellers?.filter(r => r.tier === 'silver' && r.status === 'approved').length ?? 0,
    gold: resellers?.filter(r => r.tier === 'gold' && r.status === 'approved').length ?? 0,
    platinum: resellers?.filter(r => r.tier === 'platinum' && r.status === 'approved').length ?? 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleEditTier = (tier: ResellerTierBenefit) => {
    setEditingTier({ ...tier });
    setEditDialogOpen(true);
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;

    try {
      await updateTierBenefit.mutateAsync({
        id: editingTier.id,
        updates: {
          discount_percentage: editingTier.discount_percentage,
          min_order_value: editingTier.min_order_value,
          max_cod_percentage: editingTier.max_cod_percentage,
          priority_support: editingTier.priority_support,
          free_shipping_threshold: editingTier.free_shipping_threshold,
          description: editingTier.description,
        },
      });
      toast.success(`${tierNames[editingTier.tier]} tier updated successfully!`);
      setEditDialogOpen(false);
    } catch (err) {
      toast.error('Failed to update tier');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Error loading tier benefits
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/resellers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tier Management</h1>
          <p className="text-muted-foreground">
            Configure reseller tier benefits and pricing
          </p>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers?.map((tier) => {
          const colors = tierColors[tier.tier];
          return (
            <Card
              key={tier.id}
              className={`${colors.bg} ${colors.border} border-2 overflow-hidden`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className={`h-6 w-6 ${colors.icon}`} />
                    <CardTitle className={colors.text}>{tierNames[tier.tier]}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTier(tier)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className={colors.text}>
                  {tier.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Resellers</span>
                  </div>
                  <Badge variant="secondary">{resellerCounts[tier.tier]}</Badge>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Discount</span>
                    </div>
                    <span className="font-bold text-lg">
                      {tier.discount_percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Min Order</span>
                    </div>
                    <span className="font-medium">
                      {Number(tier.min_order_value) > 0
                        ? formatCurrency(Number(tier.min_order_value))
                        : 'None'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Max COD</span>
                    </div>
                    <span className="font-medium">{tier.max_cod_percentage}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Free Shipping</span>
                    </div>
                    <span className="font-medium">
                      {tier.free_shipping_threshold 
                        ? formatCurrency(Number(tier.free_shipping_threshold)) + '+'
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Priority Support</span>
                    </div>
                    <Badge
                      variant={tier.priority_support ? 'default' : 'secondary'}
                    >
                      {tier.priority_support ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Comparison</CardTitle>
          <CardDescription>
            Quick overview of all tier benefits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Benefit</th>
                  {tiers?.map((tier) => (
                    <th
                      key={tier.id}
                      className={`text-center py-3 px-4 ${tierColors[tier.tier].text}`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-4 w-4" />
                        {tierNames[tier.tier]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">Discount Rate</td>
                  {tiers?.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4 font-medium">
                      {tier.discount_percentage}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Minimum Order Value</td>
                  {tiers?.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {Number(tier.min_order_value) > 0
                        ? formatCurrency(Number(tier.min_order_value))
                        : 'None'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Max COD Percentage</td>
                  {tiers?.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.max_cod_percentage}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Free Shipping Threshold</td>
                  {tiers?.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.free_shipping_threshold 
                        ? formatCurrency(Number(tier.free_shipping_threshold))
                        : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4">Priority Support</td>
                  {tiers?.map((tier) => (
                    <td key={tier.id} className="text-center py-3 px-4">
                      {tier.priority_support ? '✓' : '✗'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Tier Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          {editingTier && (
            <>
              <DialogHeader>
                <DialogTitle>Edit {tierNames[editingTier.tier]}</DialogTitle>
                <DialogDescription>
                  Update tier benefits and requirements
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Discount Percentage (%)</Label>
                  <Input
                    type="number"
                    value={editingTier.discount_percentage}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Order Value (LKR)</Label>
                  <Input
                    type="number"
                    value={editingTier.min_order_value}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        min_order_value: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max COD Percentage (%)</Label>
                  <Input
                    type="number"
                    value={editingTier.max_cod_percentage}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        max_cod_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Free Shipping Threshold (LKR)</Label>
                  <Input
                    type="number"
                    value={editingTier.free_shipping_threshold ?? 0}
                    onChange={(e) =>
                      setEditingTier({
                        ...editingTier,
                        free_shipping_threshold: parseFloat(e.target.value) || null,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Priority Support</Label>
                  <Switch
                    checked={editingTier.priority_support}
                    onCheckedChange={(checked) =>
                      setEditingTier({ ...editingTier, priority_support: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editingTier.description ?? ''}
                    onChange={(e) =>
                      setEditingTier({ ...editingTier, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTier}
                  disabled={updateTierBenefit.isPending}
                >
                  {updateTierBenefit.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
