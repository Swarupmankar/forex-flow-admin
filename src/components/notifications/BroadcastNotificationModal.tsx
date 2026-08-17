import { useState, useEffect } from "react";
import { Radio, AlertTriangle, Info, CheckCircle2, ShieldAlert, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  useGetNotificationCatalogQuery,
  useBroadcastNotificationMutation,
} from "@/API/notifications.api";
import type { NotificationSeverity } from "@/features/notifications/notifications.types";

interface BroadcastNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SYSTEM_EVENTS = [
  "SCHEDULED_MAINTENANCE",
  "TRADING_TEMPORARILY_UNAVAILABLE",
  "DEPOSIT_SERVICE_UNAVAILABLE",
  "WITHDRAWAL_SERVICE_UNAVAILABLE",
  "MARKET_DATA_INTERRUPTION",
  "TRADING_SYSTEM_ISSUE",
  "SERVICE_RESTORED",
];

const SEVERITIES: NotificationSeverity[] = [
  "INFORMATIONAL",
  "ACTION_REQUIRED",
  "CRITICAL",
];

interface MetadataItem {
  key: string;
  value: string;
}

export function BroadcastNotificationModal({
  isOpen,
  onClose,
}: BroadcastNotificationModalProps) {
  const { toast } = useToast();
  const { data: catalog, isLoading: isCatalogLoading } = useGetNotificationCatalogQuery(
    undefined,
    { skip: !isOpen }
  );
  const [broadcastNotification, { isLoading: isBroadcasting }] =
    useBroadcastNotificationMutation();

  const systemEvents = catalog?.systemEvents?.length
    ? catalog.systemEvents
    : DEFAULT_SYSTEM_EVENTS;

  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<NotificationSeverity>("INFORMATIONAL");
  const [metadataItems, setMetadataItems] = useState<MetadataItem[]>([]);
  const [rawJsonMode, setRawJsonMode] = useState<boolean>(false);
  const [rawJson, setRawJson] = useState<string>("{}");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  // Auto-populate form when event selection changes
  const handleEventChange = (event: string) => {
    setSelectedEvent(event);
    if (errors.event) setErrors((prev) => ({ ...prev, event: "" }));

    const template = catalog?.templates?.[event];
    if (template) {
      setTitle(template.title ?? "");
      setDescription(template.description ?? "");
      setSeverity(template.severity ?? "INFORMATIONAL");
    } else {
      setTitle("");
      setDescription("");
      setSeverity("INFORMATIONAL");
    }

    // Preset helpful default metadata suggestions based on event
    if (event === "SCHEDULED_MAINTENANCE") {
      const now = new Date();
      const end = new Date(now.getTime() + 3600000);
      setMetadataItems([
        { key: "startsAt", value: now.toISOString() },
        { key: "endsAt", value: end.toISOString() },
        { key: "affectedServices", value: "trading, wallet" },
      ]);
    } else if (event === "TRADING_TEMPORARILY_UNAVAILABLE") {
      setMetadataItems([
        { key: "service", value: "trading" },
        { key: "incidentId", value: `INC-${Date.now().toString().slice(-6)}` },
      ]);
    } else {
      setMetadataItems([]);
    }
  };

  // If catalog finishes loading after event is selected, populate template defaults if fields are empty
  useEffect(() => {
    if (selectedEvent && catalog?.templates?.[selectedEvent]) {
      const template = catalog.templates[selectedEvent];
      if (!title) setTitle(template.title ?? "");
      if (!description) setDescription(template.description ?? "");
      if (template.severity) setSeverity(template.severity);
    }
  }, [catalog, selectedEvent]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedEvent("");
      setTitle("");
      setDescription("");
      setSeverity("INFORMATIONAL");
      setMetadataItems([]);
      setRawJson("{}");
      setRawJsonMode(false);
      setErrors({});
      setIsConfirmDialogOpen(false);
    }
  }, [isOpen]);

  const addMetadataField = () => {
    setMetadataItems((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeMetadataField = (index: number) => {
    setMetadataItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMetadataField = (index: number, field: "key" | "value", val: string) => {
    setMetadataItems((prev) => {
      const next = [...prev];
      next[index][field] = val;
      return next;
    });
  };

  const parseMetadata = (): Record<string, unknown> | null => {
    if (rawJsonMode) {
      if (!rawJson.trim()) return {};
      try {
        const parsed = JSON.parse(rawJson);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          setErrors((prev) => ({ ...prev, metadata: "Metadata JSON must be an object" }));
          return null;
        }
        return parsed;
      } catch (err) {
        setErrors((prev) => ({ ...prev, metadata: "Invalid JSON format" }));
        return null;
      }
    } else {
      const obj: Record<string, unknown> = {};
      for (const item of metadataItems) {
        if (item.key.trim()) {
          const trimmedVal = item.value.trim();
          if (trimmedVal === "true") obj[item.key.trim()] = true;
          else if (trimmedVal === "false") obj[item.key.trim()] = false;
          else if (trimmedVal.startsWith("[") || trimmedVal.startsWith("{")) {
            try {
              obj[item.key.trim()] = JSON.parse(trimmedVal);
            } catch {
              obj[item.key.trim()] = trimmedVal;
            }
          } else if (trimmedVal.includes(",")) {
            obj[item.key.trim()] = trimmedVal.split(",").map((s) => s.trim());
          } else {
            obj[item.key.trim()] = trimmedVal;
          }
        }
      }
      return obj;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedEvent) {
      newErrors.event = "System event selection is required";
    }
    if (title.length > 120) {
      newErrors.title = "Title must not exceed 120 characters";
    }
    if (description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters";
    }

    const metadata = parseMetadata();
    if (metadata === null) {
      newErrors.metadata = newErrors.metadata || "Invalid metadata configuration";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialSubmit = () => {
    if (!validateForm()) return;
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmBroadcast = async () => {
    const parsedMetadata = parseMetadata() ?? undefined;

    try {
      const result = await broadcastNotification({
        event: selectedEvent as any,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        severity,
        ...(parsedMetadata && Object.keys(parsedMetadata).length > 0
          ? { metadata: parsedMetadata }
          : {}),
      }).unwrap();

      toast({
        title: "📡 Notification Broadcasted",
        description: `Successfully broadcasted "${result.title}" to ${result.count} users in real-time.`,
      });

      setIsConfirmDialogOpen(false);
      onClose();
    } catch (err: any) {
      let errMsg = "Failed to broadcast notification.";
      if (err?.data) {
        if (typeof err.data === "string") {
          errMsg = err.data;
        } else if (typeof err.data === "object") {
          if (err.data.message && typeof err.data.message === "string") {
            errMsg = err.data.message;
          } else {
            const errorEntries = Object.entries(err.data)
              .map(([key, val]) => `${key}: ${val}`)
              .join(", ");
            if (errorEntries) {
              errMsg = errorEntries;
            }
          }
        }
      }

      toast({
        title: "❌ Broadcast Failed",
        description: errMsg,
        variant: "destructive",
      });
      setIsConfirmDialogOpen(false);
    }
  };

  const getSeverityBadge = (sev: NotificationSeverity) => {
    switch (sev) {
      case "CRITICAL":
        return (
          <Badge className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/30 flex items-center gap-1 w-fit">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL
          </Badge>
        );
      case "ACTION_REQUIRED":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/30 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            ACTION REQUIRED
          </Badge>
        );
      case "INFORMATIONAL":
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/30 flex items-center gap-1 w-fit">
            <Info className="w-3 h-3" />
            INFORMATIONAL
          </Badge>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Radio className="h-6 w-6 text-indigo-500 animate-pulse" />
              <DialogTitle className="text-xl">
                Broadcast System Notification
              </DialogTitle>
            </div>
            <DialogDescription>
              Broadcast a system notification to all users in real-time via WebSocket and add it to their notification center.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* System Event Selector */}
            <div className="space-y-2">
              <Label htmlFor="event-select" className="font-semibold">
                System Event <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedEvent}
                onValueChange={handleEventChange}
                disabled={isCatalogLoading}
              >
                <SelectTrigger
                  id="event-select"
                  className={errors.event ? "border-destructive" : ""}
                >
                  <SelectValue
                    placeholder={
                      isCatalogLoading
                        ? "Loading system events..."
                        : "Select system event event type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {systemEvents.map((evt) => (
                    <SelectItem key={evt} value={evt}>
                      {evt.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.event && (
                <p className="text-xs text-destructive">{errors.event}</p>
              )}
            </div>

            {/* Severity Level */}
            <div className="space-y-2">
              <Label className="font-semibold">Severity</Label>
              <div className="grid grid-cols-3 gap-3">
                {SEVERITIES.map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      severity === sev
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    {getSeverityBadge(sev)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="broadcast-title" className="font-semibold">
                  Title <span className="text-xs text-muted-foreground">(Optional override)</span>
                </Label>
                <span
                  className={`text-xs ${
                    title.length > 120 ? "text-destructive font-bold" : "text-muted-foreground"
                  }`}
                >
                  {title.length}/120
                </span>
              </div>
              <Input
                id="broadcast-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                }}
                placeholder="Leave blank to use default event title"
                className={errors.title ? "border-destructive" : ""}
                maxLength={130}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="broadcast-description" className="font-semibold">
                  Description <span className="text-xs text-muted-foreground">(Optional override)</span>
                </Label>
                <span
                  className={`text-xs ${
                    description.length > 500
                      ? "text-destructive font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {description.length}/500
                </span>
              </div>
              <Textarea
                id="broadcast-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description)
                    setErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Leave blank to use default event description"
                rows={3}
                className={errors.description ? "border-destructive" : ""}
                maxLength={520}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Additional Metadata */}
            <div className="space-y-3 p-4 border rounded-lg bg-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Event Metadata</h4>
                  <p className="text-xs text-muted-foreground">
                    Attach extra details like incident IDs, affected services, or start/end times.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRawJsonMode(!rawJsonMode)}
                  className="text-xs"
                >
                  {rawJsonMode ? "Switch to Key-Value Mode" : "Switch to Raw JSON"}
                </Button>
              </div>

              {rawJsonMode ? (
                <div className="space-y-1">
                  <Textarea
                    value={rawJson}
                    onChange={(e) => {
                      setRawJson(e.target.value);
                      if (errors.metadata)
                        setErrors((prev) => ({ ...prev, metadata: "" }));
                    }}
                    placeholder='{"startsAt": "2026-08-14T02:00:00.000Z", "affectedServices": ["trading"]}'
                    rows={4}
                    className="font-mono text-xs"
                  />
                  {errors.metadata && (
                    <p className="text-xs text-destructive">{errors.metadata}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {metadataItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Key (e.g. startsAt)"
                        value={item.key}
                        onChange={(e) =>
                          updateMetadataField(index, "key", e.target.value)
                        }
                        className="flex-1 text-xs"
                      />
                      <Input
                        placeholder="Value (e.g. 2026-08-14T02:00:00Z)"
                        value={item.value}
                        onChange={(e) =>
                          updateMetadataField(index, "value", e.target.value)
                        }
                        className="flex-1 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMetadataField(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMetadataField}
                    className="w-full text-xs mt-1"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Metadata Field
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInitialSubmit}
              disabled={!selectedEvent}
              className="sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Radio className="h-4 w-4 mr-2" />
              Review Broadcast
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before sending broadcast */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Real-time System Broadcast
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to broadcast this notification to <strong>ALL users</strong>? Online users will receive this instantly via WebSocket.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2 p-3 rounded-lg border bg-muted/40 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">EVENT:</span>
              <Badge variant="outline">{selectedEvent}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground">SEVERITY:</span>
              {getSeverityBadge(severity)}
            </div>
            <div>
              <span className="font-semibold text-xs text-muted-foreground">TITLE:</span>
              <p className="font-medium text-foreground">
                {title.trim() || catalog?.templates?.[selectedEvent]?.title || "Default Title"}
              </p>
            </div>
            <div>
              <span className="font-semibold text-xs text-muted-foreground">DESCRIPTION:</span>
              <p className="text-muted-foreground text-xs">
                {description.trim() || catalog?.templates?.[selectedEvent]?.description || "Default Description"}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBroadcasting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBroadcast}
              disabled={isBroadcasting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isBroadcasting ? (
                "Broadcasting..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Broadcast Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
