import { useState } from 'react';
import {
  Upload,
  Search,
  Grid3X3,
  List,
  FolderPlus,
  Trash2,
  Download,
  Copy,
  Edit,
  MoreHorizontal,
  Image as ImageIcon,
  Folder,
  X,
  Check,
  Info,
  HardDrive,
  Images,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/admin/StatCard';
import { mockMediaItems, mockFolders, formatFileSize } from '@/data/mediaMockData';
import type { MediaItem, MediaFolder } from '@/data/mediaMockData';
import { toast } from 'sonner';

export default function MediaLibrary() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [detailsItem, setDetailsItem] = useState<MediaItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editAltText, setEditAltText] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const filteredItems = mockMediaItems.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.altText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFolder = folderFilter === 'all' || item.folder === folderFilter;
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'image' && item.mimeType.startsWith('image/')) ||
      (typeFilter === 'video' && item.mimeType.startsWith('video/')) ||
      (typeFilter === 'document' && !item.mimeType.startsWith('image/') && !item.mimeType.startsWith('video/'));
    return matchesSearch && matchesFolder && matchesType;
  });

  const stats = {
    totalFiles: mockMediaItems.length,
    totalSize: mockMediaItems.reduce((acc, item) => acc + item.size, 0),
    folders: mockFolders.length,
    images: mockMediaItems.filter((item) => item.mimeType.startsWith('image/')).length,
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  const toggleSelect = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const handleDeleteConfirm = () => {
    toast.success(`${selectedItems.length > 0 ? selectedItems.length : 1} file(s) deleted`);
    setSelectedItems([]);
    setDeleteDialogOpen(false);
    setDetailsItem(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      toast.success(`Folder "${newFolderName}" created`);
      setNewFolderName('');
      setFolderDialogOpen(false);
    }
  };

  const handleUpload = () => {
    toast.success('Files uploaded successfully');
    setUploadDialogOpen(false);
  };

  const handleSaveAltText = () => {
    if (detailsItem) {
      toast.success('Alt text updated');
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
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground">Manage images and files for your store</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Files"
          value={stats.totalFiles}
          icon={Images}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Storage Used"
          value={formatFileSize(stats.totalSize)}
          icon={HardDrive}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Folders"
          value={stats.folders}
          icon={Folder}
          iconColor="bg-warning/10 text-warning"
        />
        <StatCard
          title="Images"
          value={stats.images}
          icon={ImageIcon}
          iconColor="bg-success/10 text-success"
        />
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {mockFolders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.slug}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedItems.length} file(s) selected</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Folder className="mr-2 h-4 w-4" />
                  Move to Folder
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Media Grid/List */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                    selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setDetailsItem(item)}
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.altText || item.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(e) => {
                        e && e.valueOf();
                        toggleSelect(item.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-background/80 backdrop-blur"
                    />
                  </div>
                  <div className="p-2 border-t">
                    <p className="text-xs font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[60px]">Preview</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Folder</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => setDetailsItem(item)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="h-10 w-10 rounded border bg-muted overflow-hidden">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.altText || item.filename}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{item.filename}</p>
                          <p className="text-xs text-muted-foreground">{item.mimeType}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.folder}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(item.size)}</TableCell>
                        <TableCell>
                          {item.width && item.height ? `${item.width}×${item.height}` : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleCopyUrl(item.url)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDetailsItem(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedItems([item.id]);
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No files found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Panel */}
        {detailsItem && (
          <Card className="w-80 shrink-0 sticky top-6 h-fit">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">File Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setDetailsItem(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg border bg-muted overflow-hidden">
                <img
                  src={detailsItem.url}
                  alt={detailsItem.altText || detailsItem.filename}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Filename</Label>
                  <p className="text-sm font-medium">{detailsItem.filename}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Original Name</Label>
                  <p className="text-sm">{detailsItem.originalFilename}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Size</Label>
                    <p className="text-sm">{formatFileSize(detailsItem.size)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Dimensions</Label>
                    <p className="text-sm">
                      {detailsItem.width && detailsItem.height
                        ? `${detailsItem.width}×${detailsItem.height}`
                        : '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="text-sm">{detailsItem.mimeType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Folder</Label>
                  <p className="text-sm capitalize">{detailsItem.folder}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Uploaded</Label>
                  <p className="text-sm">{formatDate(detailsItem.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">by {detailsItem.uploadedBy}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {detailsItem.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="altText">Alt Text</Label>
                <Textarea
                  id="altText"
                  value={editAltText || detailsItem.altText || ''}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Describe this image..."
                  rows={2}
                />
                <Button size="sm" className="w-full" onClick={handleSaveAltText}>
                  <Check className="mr-2 h-4 w-4" />
                  Save Alt Text
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">File URL</Label>
                <div className="flex gap-2">
                  <Input value={detailsItem.url} readOnly className="text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyUrl(detailsItem.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setSelectedItems([detailsItem.id]);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload images and files to your media library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP up to 10MB</p>
            </div>
            <div className="space-y-2">
              <Label>Upload to Folder</Label>
              <Select defaultValue="products">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.slug}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="product, featured, new" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your media files into folders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Product Thumbnails"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Folder (optional)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Root" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root (No parent)</SelectItem>
                  {mockFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItems.length} file(s)? This action cannot be
              undone and may affect products using these images.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
