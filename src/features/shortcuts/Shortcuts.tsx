import { useState, useEffect } from "react";
import {
  Keyboard,
  ArrowLeft,
  Search,
  Command,
  Edit2,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ShortcutItem } from "@/lib/shortcutRegistry";
import { useShortcutStore, useUiStore } from "@/stores";
import { toast } from "sonner";

export function Shortcuts() {
  const navigate = useNavigate();
  const { shortcuts, loadShortcuts, updateShortcut, resetShortcut } = useShortcutStore();
  const [searchTerm, setSearchTerm] = useState("");

  // Load latest customized shortcuts from backend SQLite preferences on mount
  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  // Key Remapping State
  const [editingShortcut, setEditingShortcut] = useState<ShortcutItem | null>(null);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [recordedChar, setRecordedChar] = useState<string>("");
  const [recordedModifiers, setRecordedModifiers] = useState<{
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  }>({});

  // Track recording mode globally so all other shortcuts (e.g. Ctrl+P, Ctrl+I, Ctrl+E) are suppressed
  useEffect(() => {
    const isRecording = Boolean(editingShortcut);
    useUiStore.getState().setIsRecordingShortcut(isRecording);
    return () => {
      useUiStore.getState().setIsRecordingShortcut(false);
    };
  }, [editingShortcut]);

  // Keypress listener during editing
  useEffect(() => {
    if (!editingShortcut) return;

    const handleKeyRecording = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl) keys.push("Ctrl");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");

      // Key name formatting
      const keyName = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key;

      if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        keys.push(keyName);
        setRecordedChar(e.key.toLowerCase());
      }

      setRecordedKeys(keys);
      setRecordedModifiers({
        ctrlKey: isCtrl,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });
    };

    window.addEventListener("keydown", handleKeyRecording, true);
    return () => window.removeEventListener("keydown", handleKeyRecording, true);
  }, [editingShortcut]);

  // Conflict detection: check if another shortcut in the registry uses the recorded combination
  const conflictingShortcut = recordedChar
    ? shortcuts.find(
        (s) =>
          s.id !== editingShortcut?.id &&
          Boolean(s.ctrlKey) === Boolean(recordedModifiers.ctrlKey) &&
          Boolean(s.shiftKey) === Boolean(recordedModifiers.shiftKey) &&
          Boolean(s.altKey) === Boolean(recordedModifiers.altKey) &&
          (s.key.toLowerCase() === recordedChar.toLowerCase() ||
            (s.key === "+" && (recordedChar === "+" || recordedChar === "=")))
      )
    : null;

  const handleSaveRemap = async () => {
    if (!editingShortcut || recordedKeys.length === 0 || !recordedChar) {
      toast.error("Please press a valid key combination");
      return;
    }

    // Resolve conflict by unassigning keybinding from conflicting shortcut
    if (conflictingShortcut) {
      await updateShortcut(conflictingShortcut.id, [], "", {
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      });
      toast.info(`Unassigned keybinding from '${conflictingShortcut.title}' to avoid collision`);
    }

    // Save new keybinding to target shortcut and persist to SQLite backend
    await updateShortcut(
      editingShortcut.id,
      recordedKeys,
      recordedChar,
      recordedModifiers
    );

    toast.success(`Updated keybinding for ${editingShortcut.title}`);
    setEditingShortcut(null);
  };

  const handleReset = async (id: string) => {
    await resetShortcut(id);
  };

  const filtered = shortcuts.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keys.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-auto">
      <div className="max-w-3xl mx-auto py-8 px-6 w-full space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="pl-0 text-muted-foreground hover:text-foreground -ml-2 mb-2 h-8 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Editor
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Keyboard Shortcuts</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Customize & manage VS Code-level keybindings with native backend sync.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter shortcuts (e.g. Ctrl+P, Settings, Editor)..."
            className="pl-9 text-sm bg-muted/20"
          />
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-6">
          {categories.map((cat) => {
            const items = filtered.filter((s) => s.category === cat);
            if (items.length === 0) return null;

            return (
              <Card key={cat} className="shadow-none border-border">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Command className="w-4 h-4 text-primary" />
                    {cat}
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/40 p-0">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-3 px-4 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="space-y-0.5 pr-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-medium text-foreground">
                            {shortcut.title}
                          </h4>
                          {shortcut.isCustomized && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Customized
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {shortcut.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          {shortcut.keys.length === 0 ? (
                            <span className="text-xs text-muted-foreground/60 italic font-mono px-2 py-0.5 rounded bg-muted/40 border border-border/40">
                              Unassigned
                            </span>
                          ) : (
                            shortcut.keys.map((k, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                {idx > 0 && <span className="text-xs text-muted-foreground/60">+</span>}
                                <kbd className="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-[11px] font-semibold shadow-xs border border-border/80">
                                  {k}
                                </kbd>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Remap and Reset Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                            title="Edit Keybinding"
                            onClick={() => {
                              setEditingShortcut(shortcut);
                              setRecordedKeys([]);
                              setRecordedChar("");
                              setRecordedModifiers({});
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {shortcut.isCustomized && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Reset to Default"
                              onClick={() => handleReset(shortcut.id)}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Key Recording Modal */}
      {editingShortcut && (
        <Dialog open={Boolean(editingShortcut)} onOpenChange={() => setEditingShortcut(null)}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Edit Keybinding
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Press your desired key combination on your keyboard for{" "}
                <span className="font-semibold text-foreground">{editingShortcut.title}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl bg-muted/20">
              {recordedKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground animate-pulse font-medium">
                  Press keys on your keyboard...
                </p>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {recordedKeys.map((k, idx) => (
                      <span key={idx} className="flex items-center gap-1.5">
                        {idx > 0 && <span className="text-xs text-muted-foreground">+</span>}
                        <kbd className="px-3 py-1.5 rounded-md bg-background text-foreground font-mono text-sm font-bold shadow-sm border border-border">
                          {k}
                        </kbd>
                      </span>
                    ))}
                  </div>

                  {/* Conflict Warning Indicator directly on screen */}
                  {conflictingShortcut && (
                    <div className="flex items-center gap-2 p-2.5 px-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-medium animate-in fade-in-0">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Currently assigned to:{" "}
                        <strong className="font-semibold">{conflictingShortcut.title}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingShortcut(null)}
                className="text-xs gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </Button>
              <Button
                size="sm"
                disabled={recordedKeys.length === 0 || !recordedChar}
                onClick={handleSaveRemap}
                className="text-xs gap-1 bg-primary text-primary-foreground"
              >
                <Check className="w-3.5 h-3.5" />
                {conflictingShortcut ? "Reassign & Save" : "Save Keybinding"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
