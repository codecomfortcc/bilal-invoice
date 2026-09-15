import { useState } from "react";
import { ALL_SETTINGS_REGISTRY, RegistrySetting, RegistryContext } from "@/lib/settingsRegistry";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useCompanyStore, useUiStore } from "@/stores";
import { useTheme } from "@/components/theme-provider";
import { useNavigate } from "react-router-dom";
import { Sliders, Zap } from "lucide-react";

interface DynamicSettingsRendererProps {
  category?: string;
  settings?: RegistrySetting[];
  title?: string;
  description?: string;
}

export function DynamicSettingsRenderer({
  category,
  settings: propSettings,
  title,
  description,
}: DynamicSettingsRendererProps) {
  const navigate = useNavigate();
  const company = useCompanyStore((s) => s.company);
  const setCompany = useCompanyStore((s) => s.setCompany);
  const { developerMode, setDeveloperMode } = useUiStore();
  const { theme, setTheme } = useTheme();

  const [, forceUpdate] = useState({});

  const registryCtx: RegistryContext = {
    company,
    setCompany,
    uiStore: { developerMode, setDeveloperMode },
    themeStore: { theme, setTheme },
    navigate,
  };

  const activeSettings = propSettings
    ? propSettings
    : category
    ? ALL_SETTINGS_REGISTRY.filter((s) => s.category === category)
    : ALL_SETTINGS_REGISTRY;

  if (activeSettings.length === 0) return null;

  return (
    <Card className="shadow-none border-border">
      {title && (
        <CardHeader className="pb-4 border-b border-border mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-[15px]">{title}</CardTitle>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {activeSettings.map((setting) => {
          const isDevRestricted = Boolean(setting.requiresDeveloperMode && !developerMode);

          return (
            <div
              key={setting.id}
              id={setting.targetId || setting.id}
              className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20"
            >
              <div className="space-y-0.5 pr-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-[13px] font-medium text-foreground">
                    {setting.title}
                  </h4>
                  {isDevRestricted && (
                    <span className="text-[9px] px-1 py-0 rounded font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Dev Mode OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {setting.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {/* TOGGLE CONTROL */}
                {setting.controlType === "toggle" && (
                  <Switch
                    checked={setting.getValue?.(registryCtx) ?? false}
                    onCheckedChange={async (checked) => {
                      await setting.onToggle?.(checked, registryCtx);
                      forceUpdate({});
                    }}
                  />
                )}

                {/* SELECT CONTROL */}
                {setting.controlType === "select" && setting.options && (
                  <Select
                    value={setting.getSelectValue?.(registryCtx) || ""}
                    onValueChange={async (val) => {
                      if (val) {
                        await setting.onSelectChange?.(val, registryCtx);
                        forceUpdate({});
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] shrink-0">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="z-[99999]">
                      {setting.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* COLOR PICKER CONTROL */}
                {setting.controlType === "color" && (
                  <div className="w-[180px] flex justify-end">
                    <ColorPicker
                      color={setting.getColorValue?.(registryCtx) || "#000000"}
                      onChange={async (color) => {
                        await setting.onColorChange?.(color, registryCtx);
                        forceUpdate({});
                      }}
                    />
                  </div>
                )}

                {/* INPUT CONTROL */}
                {setting.controlType === "input" && (
                  <Input
                    type={setting.inputType || "text"}
                    placeholder={setting.inputPlaceholder || ""}
                    value={String(setting.getInputValue?.(registryCtx) ?? "")}
                    onChange={async (e) => {
                      await setting.onInputChange?.(e.target.value, registryCtx);
                      forceUpdate({});
                    }}
                    className="w-[180px] text-xs h-8 bg-background"
                  />
                )}

                {/* ACTION BUTTON CONTROL */}
                {setting.controlType === "action" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 ${
                      isDevRestricted ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={async () => {
                      await setting.onExecute?.(registryCtx);
                      forceUpdate({});
                    }}
                  >
                    <Zap className="h-3.5 w-3.5 text-purple-400" />
                    {setting.actionLabel || "Execute"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
