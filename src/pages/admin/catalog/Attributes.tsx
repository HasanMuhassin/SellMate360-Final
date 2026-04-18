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
import { mockAttributes } from '@/data/attributesMockData';
import type { Attribute, AttributeOption } from '@/data/attributesMockData';
import { toast } from 'sonner';

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
  const [attributes, setAttributes] = useState<Attribute[]>(mockAttributes);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'select' as Attribute['type'],
    description: '',
    isRequired: false,
    isFilterable: true,
    isVisible: true,
  });
  const [newOption, setNewOption] = useState({ value: '', label: '', colorHex: '' });

  const filteredAttributes = attributes.filter((attr) => {
    const matchesSearch =
      attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || attr.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalAttributes: attributes.length,
    totalOptions: attributes.reduce((acc, attr) => acc + attr.options.length, 0),
    filterableCount: attributes.filter((attr) => attr.isFilterable).length,
    colorAttributes: attributes.filter((attr) => attr.type === 'color').length,
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
    setSelectedAttribute(null);
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
    setSelectedAttribute(attribute);
    setFormData({
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      description: attribute.description,
      isRequired: attribute.isRequired,
      isFilterable: attribute.isFilterable,
      isVisible: attribute.isVisible,
    });
    setEditDialogOpen(true);
  };

  const openOptionsDialog = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setOptionsDialogOpen(true);
  };

  const handleSaveAttribute = () => {
    if (!formData.name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    if (selectedAttribute) {
      setAttributes((prev) =>
        prev.map((attr) =>
          attr.id === selectedAttribute.id
            ? {
                ...attr,
                ...formData,
                updatedAt: new Date().toISOString(),
              }
            : attr
        )
      );
      toast.success('Attribute updated successfully');
    } else {
      const newAttribute: Attribute = {
        id: `attr-${Date.now()}`,
        ...formData,
        options: [],
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAttributes((prev) => [...prev, newAttribute]);
      toast.success('Attribute created successfully');
    }
    setEditDialogOpen(false);
  };

  const handleDeleteAttribute = () => {
    if (selectedAttribute) {
      setAttributes((prev) => prev.filter((attr) => attr.id !== selectedAttribute.id));
      toast.success('Attribute deleted successfully');
    }
    setDeleteDialogOpen(false);
    setSelectedAttribute(null);
  };

  const handleAddOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      toast.error('Option value and label are required');
      return;
    }

    if (selectedAttribute) {
      const option: AttributeOption = {
        id: `opt-${Date.now()}`,
        value: newOption.value.toLowerCase().replace(/\s+/g, '-'),
        label: newOption.label,
        colorHex: selectedAttribute.type === 'color' ? newOption.colorHex : undefined,
        position: selectedAttribute.options.length + 1,
      };

      setAttributes((prev) =>
        prev.map((attr) =>
          attr.id === selectedAttribute.id
            ? {
                ...attr,
                options: [...attr.options, option],
                updatedAt: new Date().toISOString(),
              }
            : attr
        )
      );

      setSelectedAttribute((prev) =>
        prev ? { ...prev, options: [...prev.options, option] } : null
      );

      setNewOption({ value: '', label: '', colorHex: '' });
      toast.success('Option added successfully');
    }
  };

  const handleRemoveOption = (optionId: string) => {
    if (selectedAttribute) {
      setAttributes((prev) =>
        prev.map((attr) =>
          attr.id === selectedAttribute.id
            ? {
                ...attr,
                options: attr.options.filter((opt) => opt.id !== optionId),
                updatedAt: new Date().toISOString(),
              }
            : attr
        )
      );

      setSelectedAttribute((prev) =>
        prev ? { ...prev, options: prev.options.filter((opt) => opt.id !== optionId) } : null
      );

      toast.success('Option removed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
                          <p className="text-xs text-muted-foreground">{attribute.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{attributeTypeLabels[attribute.type]}</span>
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
                                {attribute.options.slice(0, 5).map((opt) => (
                                  <div
                                    key={opt.id}
                                    className="h-5 w-5 rounded-full border-2 border-background"
                                    style={{ backgroundColor: opt.colorHex }}
                                  />
                                ))}
                                {attribute.options.length > 5 && (
                                  <div className="h-5 w-5 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px]">
                                    +{attribute.options.length - 5}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {attribute.options.slice(0, 3).map((opt) => (
                                  <Badge key={opt.id} variant="secondary" className="text-xs">
                                    {opt.label}
                                  </Badge>
                                ))}
                                {attribute.options.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{attribute.options.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {attribute.productCount} products
                        </span>
                      </TableCell>
                      <TableCell>
                        {attribute.isFilterable ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {attribute.isVisible ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(attribute.updatedAt)}
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
                                setSelectedAttribute(attribute);
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
            <DialogTitle>{selectedAttribute ? 'Edit Attribute' : 'Create Attribute'}</DialogTitle>
            <DialogDescription>
              {selectedAttribute
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
                onValueChange={(value: Attribute['type']) =>
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
              {selectedAttribute ? 'Save Changes' : 'Create Attribute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Options Dialog */}
      <Dialog open={optionsDialogOpen} onOpenChange={setOptionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Options: {selectedAttribute?.name}</DialogTitle>
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
                      placeholder="Value (e.g., lg)"
                    />
                  </div>
                  {selectedAttribute?.type === 'color' && (
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
                  Current Options ({selectedAttribute?.options.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAttribute?.options.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options added yet. Add your first option above.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedAttribute?.options.map((option, index) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                        {selectedAttribute.type === 'color' && option.colorHex && (
                          <div
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: option.colorHex }}
                          />
                        )}
                        <div className="flex-1">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">({option.value})</span>
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
              Are you sure you want to delete "{selectedAttribute?.name}"? This will remove the
              attribute and all its options from{' '}
              {selectedAttribute?.productCount || 0} products. This action cannot be undone.
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
