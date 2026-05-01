import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Edit, Trash2, ChevronRight, HelpCircle, Folder, Eye, EyeOff, GripVertical,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import {
  useFAQCategories, useCreateFAQCategory, useUpdateFAQCategory, useDeleteFAQCategory,
  useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ,
  FAQCategory, FAQ,
} from '@/hooks/useFAQs';

// ─── Helper: auto-generate slug ─────────────────────────────────────────────
function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

// ─── Category Dialog ─────────────────────────────────────────────────────────
function CategoryDialog({
  open, onClose, initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: FAQCategory;
}) {
  const create = useCreateFAQCategory();
  const update = useUpdateFAQCategory();
  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  const saving = create.isPending || update.isPending;

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { ...form, slug: form.slug || toSlug(form.name) };
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || toSlug(e.target.value) })}
              placeholder="e.g. Shipping & Delivery"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="shipping-delivery"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── FAQ Dialog ───────────────────────────────────────────────────────────────
function FAQDialog({
  open, onClose, categoryId, initial,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  initial?: FAQ;
}) {
  const create = useCreateFAQ();
  const update = useUpdateFAQ();
  const [form, setForm] = useState({
    question: initial?.question || '',
    answer: initial?.answer || '',
    sort_order: initial?.sort_order ?? 0,
    is_published: initial?.is_published ?? true,
  });

  const saving = create.isPending || update.isPending;

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form });
    } else {
      await create.mutateAsync({ ...form, category_id: categoryId });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="faq-q">Question *</Label>
            <Input
              id="faq-q"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="e.g. How long does delivery take?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faq-a">Answer * <span className="text-xs text-muted-foreground">(HTML supported)</span></Label>
            <Textarea
              id="faq-a"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              placeholder="Provide a detailed answer. You can use HTML tags for formatting."
              rows={8}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="faq-order">Sort Order</Label>
              <Input
                id="faq-order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.question.trim() || !form.answer.trim()}>
            {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FAQsPage() {
  const { data: categories = [], isLoading: catsLoading } = useFAQCategories();
  const [selectedCat, setSelectedCat] = useState<FAQCategory | null>(null);
  const { data: faqs = [], isLoading: faqsLoading } = useFAQs(selectedCat?.id);
  const deleteCategory = useDeleteFAQCategory();
  const deleteFAQ = useDeleteFAQ();
  const updateFAQ = useUpdateFAQ();

  const [catDialog, setCatDialog] = useState<{ open: boolean; initial?: FAQCategory }>({ open: false });
  const [faqDialog, setFaqDialog] = useState<{ open: boolean; initial?: FAQ }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'faq'; id: string; name: string } | null>(null);

  const totalFAQs = categories.reduce((acc) => acc, 0);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') {
      await deleteCategory.mutateAsync(deleteTarget.id);
      if (selectedCat?.id === deleteTarget.id) setSelectedCat(null);
    } else {
      await deleteFAQ.mutateAsync(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  if (catsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions and categories</p>
        </div>
        <Button size="sm" onClick={() => setCatDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Categories" value={categories.length.toString()} icon={Folder} description="FAQ sections" />
        <StatCard title="Active Categories" value={categories.filter(c => c.is_active).length.toString()} icon={Eye} description="Visible to customers" />
        <StatCard title="Total FAQs" value={faqs.length.toString()} icon={HelpCircle} description={selectedCat ? `In "${selectedCat.name}"` : 'Select a category'} />
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm px-4">
                No categories yet. Create one to get started.
              </div>
            ) : (
              <div className="divide-y">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedCat?.id === cat.id ? 'bg-primary/5 border-r-2 border-primary' : ''
                    }`}
                    onClick={() => setSelectedCat(cat)}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground truncate">{cat.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!cat.is_active && <Badge variant="outline" className="text-xs py-0">Hidden</Badge>}
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); setCatDialog({ open: true, initial: cat }); }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'category', id: cat.id, name: cat.name }); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs Panel */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedCat ? `FAQs — ${selectedCat.name}` : 'Select a category'}
            </CardTitle>
            {selectedCat && (
              <Button size="sm" onClick={() => setFaqDialog({ open: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!selectedCat ? (
              <div className="py-16 text-center text-muted-foreground">
                <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a category from the left to view and manage FAQs</p>
              </div>
            ) : faqsLoading ? (
              <div className="space-y-2 p-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : faqs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-4">No FAQs in this category yet.</p>
                <Button size="sm" onClick={() => setFaqDialog({ open: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First FAQ
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {faqs.map((faq, idx) => (
                  <div key={faq.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1">{faq.question}</div>
                        <div
                          className="text-xs text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={faq.is_published}
                          onCheckedChange={(v) => updateFAQ.mutateAsync({ id: faq.id, is_published: v })}
                          className="scale-75"
                        />
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setFaqDialog({ open: true, initial: faq })}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: 'faq', id: faq.id, name: faq.question })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CategoryDialog
        open={catDialog.open}
        onClose={() => setCatDialog({ open: false })}
        initial={catDialog.initial}
      />

      {selectedCat && (
        <FAQDialog
          open={faqDialog.open}
          onClose={() => setFaqDialog({ open: false })}
          categoryId={selectedCat.id}
          initial={faqDialog.initial}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === 'category' ? 'Category' : 'FAQ'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.name}"</strong> will be permanently deleted.
              {deleteTarget?.type === 'category' && ' All FAQs in this category will also be deleted.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
