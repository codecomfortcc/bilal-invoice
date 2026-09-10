import { useEffect, useState } from "react";
import { useInventoryStore } from "@/stores";
import { InventoryItem } from "@/types/inventory";
import { saveInventoryItem, deleteInventoryItem } from "@/services/inventory.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Package, Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";

export function Inventory() {
  const { items, isLoading, fetchItems } = useInventoryStore();
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
    } else {
      setEditingItem({
        id: `item_${Date.now()}`,
        title: "",
        hsnSac: "",
        rate: 0,
        unit: "pcs",
      });
    }
    setIsFormExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!editingItem?.title?.trim()) {
      toast.error("Item title is required");
      return;
    }
    try {
      await saveInventoryItem(editingItem);
      toast.success("Item saved successfully");
      setIsFormExpanded(false);
      fetchItems();
    } catch (e) {
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteInventoryItem(id);
        toast.success("Item deleted");
        fetchItems();
      } catch (e) {
        toast.error("Failed to delete item");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Items</h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory of products and services.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} disabled={isFormExpanded}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {isFormExpanded && (
        <Card className="animate-in slide-in-from-top-4 fade-in duration-300 border border-border/50 bg-card/60 backdrop-blur-3xl shadow-lg rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 pt-6 bg-transparent border-b border-white/5">
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
              {editingItem?.id?.startsWith("item_") && !items.find(i => i.id === editingItem.id) ? "Add New Item" : "Edit Item"}
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsFormExpanded(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-5 px-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-xs font-medium text-foreground/80">Title / Description *</Label>
              <Input
                id="title"
                value={editingItem?.title || ""}
                onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Item name"
                autoFocus
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hsn_sac" className="text-xs font-medium text-foreground/80">HSN/SAC Code</Label>
              <Input
                id="hsn_sac"
                value={editingItem?.hsnSac || ""}
                onChange={(e) => setEditingItem(prev => prev ? { ...prev, hsnSac: e.target.value } : null)}
                placeholder="e.g. 8471"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="grid gap-2">
                <Label htmlFor="rate" className="text-xs font-medium text-foreground/80">Rate (₹)</Label>
                <NumberInput
                  value={editingItem?.rate?.toString() || "0"}
                  onChange={(val) => setEditingItem(prev => prev ? { ...prev, rate: Number(val) } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit" className="text-xs font-medium text-foreground/80">Unit</Label>
                <Input
                  id="unit"
                  value={editingItem?.unit || ""}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, unit: e.target.value } : null)}
                  placeholder="e.g. pcs, kg"
                />
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 bg-black/5 dark:bg-white/[0.02] px-6 py-4">
            <Button variant="ghost" className="rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors" onClick={() => setIsFormExpanded(false)}>Cancel</Button>
            <Button className="rounded-md shadow-sm" onClick={handleSave}>Save Item</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className="group relative overflow-hidden rounded-[14px] border border-white/5 bg-gradient-to-b from-white/5 to-transparent hover:from-white/10 hover:to-white/5 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            {/* Soft background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <CardHeader className="pb-3 px-5 pt-5 relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-[15px] font-semibold tracking-tight line-clamp-2 leading-tight text-foreground/90 group-hover:text-foreground transition-colors" title={item.title}>
                      {item.title}
                    </CardTitle>
                    {item.hsnSac && (
                      <div className="mt-1.5 inline-flex items-center rounded-sm bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-white/10">
                        HSN/SAC: {item.hsnSac}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 shadow-sm p-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleOpenDialog(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0 relative z-10">
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  {item.rate ? `₹${item.rate.toFixed(2)}` : "₹0.00"}
                </span>
                <span className="text-xs font-medium text-muted-foreground/70">
                  {item.unit ? `/ ${item.unit}` : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && !isLoading && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm border border-border mb-4">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No items found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              You haven't added any items to your inventory yet. Add your products or services to use them in invoices.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
