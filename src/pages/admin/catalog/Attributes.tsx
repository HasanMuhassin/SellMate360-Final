import { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Palette,
  Ruler,
  List,
  Type,
  GripVertical,
  X,
  Filter,
  Check,
  Tag,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatCard from '@/components/admin/StatCard';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAttributes, useCreateAttribute, useCreateAttributeOption, Attribute, AttributeOption } from '@/hooks/useAttributes';

const attributeTypeIcons = {
  select: List,
  color: Palette,
  size: Ruler,
  text: Type,
};

const attributeTypeLabels = {
  select: 'Dropdown',
  color: 'Color Swatch',
  size: 'Size',
  text: 'Text Input',
};

export default function Attributes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Real Database Connection
  const { data: dbAttributes = [], isLoading } = useAttributes();
  const createAttribute = useCreateAttribute();
  const createOption = useCreateAttributeOption();
  const queryClient = useQueryClient();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'select' as string,
    description: '',
    isRequired: false,
    isFilterable: true,
    isVisible: true,
  });
  const [newOption, setNewOption] = useState({ value: '', label: '', colorHex: '' });

  // Dynamically pull the active attribute to keep the options dialog fresh after mutations
  const activeAttribute = dbAttributes.find(a => a.id === selectedAttributeId) || null;

  const filteredAttributes = dbAttributes.filter((attr) => {
    const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || attr.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalAttributes: dbAttributes?.length || 0,
    totalOptions: (dbAttributes || []).reduce((acc, attr) => acc + (attr?.attribute_options?.length || 0), 0),
    filterableCount: dbAttributes?.length || 0, // Placeholder
    colorAttributes: (dbAttributes || []).filter((attr) => attr?.type === 'color').length,
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const openCreateDialog = () => {
    setSelectedAttributeId(null);
    setFormData({
      name: '',
      slug: '',
      type: 'select',
      description: '',
      isRequired: false,
      isFilterable: true,
      isVisible: true,
    });
    setEditDialogOpen(true);
  };

  const openEditDialog = (attribute: Attribute) => {
    setSelectedAttributeId(attribute.id);
    setFormData({
      name: attribute.name,
      slug: '',
      type: attribute.type,
      description: '',
      isRequired: false,
      isFilterable: true,
      isVisible: true,
    });
    setEditDialogOpen(true);
  };

  const openOptionsDialog = (attribute: Attribute) => {
    setSelectedAttributeId(attribute.id);
    setOptionsDialogOpen(true);
  };

  const handleSaveAttribute = async () => {
    const normalizedName = formData.name.trim().toLowerCase();
    
    if (!normalizedName) {
      toast.error('Attribute name is required');
      return;
    }

    // Client-side duplicate prevention (case-insensitive)
    const isDuplicate = dbAttributes.some((attr) => 
      attr.name.toLowerCase() === normalizedName && 
      attr.id !== activeAttribute?.id
    );

    if (isDuplicate) {
      toast.error(`An attribute named "${formData.name.trim()}" already exists.`);
      return;
    }

    try {
      if (activeAttribute) {
        // Update
        const { error } = await supabase.from('attributes').update({ 
          name: normalizedName, 
          type: formData.type 
        }).eq('id', activeAttribute.id);
        
        if (error) throw error;
        toast.success('Attribute updated successfully');
      } else {
        // Create
        await createAttribute.mutateAsync({ name: normalizedName, type: formData.type });
        toast.success('Attribute created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      setEditDialogOpen(false);
    } catch (e: any) {
      if (e.code === '23505') {
        toast.error('Database Error: Attribute name already exists.');
      } else {
        toast.error(e.message || 'Failed to save attribute');
      }
    }
  };

  const handleDeleteAttribute = async () => {
    if (activeAttribute) {
      try {
        const { error } = await supabase.from('attributes').delete().eq('id', activeAttribute.id);
        if (error) throw error;
        toast.success('Attribute deleted successfully');
        queryClient.invalidateQueries({ queryKey: ["attributes"] });
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete attribute');
      }
    }
    setDeleteDialogOpen(false);
    setSelectedAttributeId(null);
  };

  const handleAddOption = async () => {
    const valueToSave = (newOption.label || newOption.value).trim().toLowerCase();

    if (!valueToSave) {
      toast.error('Option value is required');
      return;
    }

    if (activeAttribute) {
      // Client-side duplicate prevention (case-insensitive)
      const isDuplicate = activeAttribute.attribute_options?.some((opt) => 
        opt.value.toLowerCase() === valueToSave
      );

      if (isDuplicate) {
        toast.error(`Option "${valueToSave}" already exists for this attribute.`);
        return;
      }

      try {
        await createOption.mutateAsync({
          attribute_id: activeAttribute.id,
          value: valueToSave,
          meta: activeAttribute.type === 'color' ? { hex: newOption.colorHex } : {}
        });
        
        setNewOption({ value: '', label: '', colorHex: '' });
        toast.success('Option added successfully');
      } catch (e: any) {
        if (e.code === '23505') {
          toast.error('Database Error: Option already exists.');
        } else {
          toast.error(e.message || 'Failed to add option');
        }
      }
    }
  };

  const handleRemoveOption = async (optionId: string) => {
    if (activeAttribute) {
      try {
        const { error } = await supabase.from('attribute_options').delete().eq('id', optionId);
        if (error) throw error;
        toast.success('Option removed');
        queryClient.invalidateQueries({ queryKey: ["attributes"] });
      } catch (e: any) {
        toast.error(e.message || 'Failed to remove option');
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attributes</h1>
          <p className="text-muted-foreground">Manage product attributes and variations</p>
        </div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Attributes"
          value={stats.totalAttributes}
          icon={Tag}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Options"
          value={stats.totalOptions}
          icon={List}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Filterable"
          value={stats.filterableCount}
          icon={Filter}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Color Attributes"
          value={stats.colorAttributes}
          icon={Palette}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="color">Color Swatch</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="text">Text Input</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attributes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribute</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Filterable</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttributes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No attributes found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttributes.map((attribute) => {
                  const TypeIcon = attributeTypeIcons[attribute.type];
                  return (
                    <TableRow key={attribute.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{attribute.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {attribute.id.slice(0,8)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {TypeIcon && <TypeIcon className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm">{attributeTypeLabels[attribute.type as keyof typeof attributeTypeLabels] || attribute.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => openOptionsDialog(attribute)}
                        >
                          <div className="flex items-center gap-2">
                            {attribute.type === 'color' ? (
                              <div className="flex -space-x-1">
                                {(attribute.attribute_options || []).slice(0, 5).map((opt) => (
                                  <div
                                    key={opt.id}
                                    className="h-5 w-5 rounded-full border-2 border-background"
                                    style={{ backgroundColor: opt.meta?.hex || '#ccc' }}
                                    title={opt.value}
                                  />
                                ))}
                                {(attribute.attribute_options?.length || 0) > 5 && (
                                  <div className="h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px]">
                                    +{(attribute.attribute_options?.length || 0) - 5}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(attribute.attribute_options || []).slice(0, 3).map((opt) => (
                                  <Badge key={opt.id} variant="secondary" className="text-xs">
                                    {opt.value}
                                  </Badge>
                                ))}
                                {(attribute.attribute_options?.length || 0) > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{(attribute.attribute_options?.length || 0) - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          Dynamic
                        </span>
                      </TableCell>
                      <TableCell>
                          <Check className="h-4 w-4 text-success" />
                      </TableCell>
                      <TableCell>
                          <Check className="h-4 w-4 text-success" />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        -
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openOptionsDialog(attribute)}>
                              <List className="mr-2 h-4 w-4" />
                              Manage Options
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(attribute)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Attribute
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedAttributeId(attribute.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Attribute Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeAttribute ? 'Edit Attribute' : 'Create Attribute'}</DialogTitle>
            <DialogDescription>
              {activeAttribute
                ? 'Update the attribute details below'
                : 'Add a new product attribute for variations'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Size, Color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Dropdown Select
                    </div>
                  </SelectItem>
                  <SelectItem value="color">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color Swatch
                    </div>
                  </SelectItem>
                  <SelectItem value="size">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Size Selector
                    </div>
                  </SelectItem>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Text Input
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this attribute"
                rows={2}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Required</Label>
                  <p className="text-xs text-muted-foreground">
                    Products must have this attribute
                  </p>
                </div>
                <Switch
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isRequired: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Filterable</Label>
                  <p className="text-xs text-muted-foreground">Show in shop filters</p>
                </div>
                <Switch
                  checked={formData.isFilterable}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isFilterable: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Visible</Label>
                  <p className="text-xs text-muted-foreground">Display on product page</p>
                </div>
                <Switch
                  checked={formData.isVisible}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isVisible: checked }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttribute}>
              {activeAttribute ? 'Save Changes' : 'Create Attribute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Options Dialog */}
      <Dialog open={optionsDialogOpen} onOpenChange={setOptionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Options: {activeAttribute?.name}</DialogTitle>
            <DialogDescription>
              Add, remove, or reorder options for this attribute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new option */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Add New Option</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="optionLabel" className="sr-only">
                      Label
                    </Label>
                    <Input
                      id="optionLabel"
                      value={newOption.label}
                      onChange={(e) => setNewOption((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder="Display label (e.g., Large)"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="optionValue" className="sr-only">
                      Value
                    </Label>
                    <Input
                      id="optionValue"
                      value={newOption.value}
                      onChange={(e) => setNewOption((prev) => ({ ...prev, value: e.target.value }))}
                      placeholder="Value (e.g., lg or Large)"
                    />
                  </div>
                  {activeAttribute?.type === 'color' && (
                    <div className="w-24">
                      <Label htmlFor="optionColor" className="sr-only">
                        Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="optionColor"
                          value={newOption.colorHex || '#000000'}
                          onChange={(e) =>
                            setNewOption((prev) => ({ ...prev, colorHex: e.target.value }))
                          }
                          className="h-9 w-9 rounded border cursor-pointer"
                        />
                        <Input
                          value={newOption.colorHex}
                          onChange={(e) =>
                            setNewOption((prev) => ({ ...prev, colorHex: e.target.value }))
                          }
                          placeholder="#HEX"
                          className="w-20 text-xs"
                        />
                      </div>
                    </div>
                  )}
                  <Button onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Options list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Current Options ({activeAttribute?.attribute_options?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAttribute?.attribute_options?.length === 0 || !activeAttribute?.attribute_options ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options added yet. Add your first option above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeAttribute?.attribute_options?.map((option, index) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                        {activeAttribute.type === 'color' && option.meta?.hex && (
                          <div
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: option.meta.hex }}
                          />
                        )}
                        <div className="flex-1">
                          <span className="font-medium">{option.value}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button onClick={() => setOptionsDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attribute</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{activeAttribute?.name}"? This will remove the
              attribute and all its options from products. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAttribute}>
              Delete Attribute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
