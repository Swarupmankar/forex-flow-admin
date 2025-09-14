import { useState, useEffect } from "react";
import { Upload, X, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Notification } from "@/pages/Notifications";

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notification: Omit<Notification, "id" | "createdAt">) => void;
  notification?: Notification | null;
}

interface FormData {
  title: string;
  message: string;
  audience: string;
  type: string;
  file?: File | null;
  attachments: Array<{
    name: string;
    type: string;
    size: string;
  }>;
}

const AUDIENCE_OPTIONS = [
  { value: "ACTIVE_CLIENTS", label: "Active Clients" },
  { value: "INACTIVE_CLIENTS", label: "Inactive Clients" },
];

const TYPE_OPTIONS = [
  { value: "SECURITY", label: "Security" },
  { value: "UPDATE", label: "Update" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "ALERT", label: "Alert" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

export function CreateAnnouncementModal({
  isOpen,
  onClose,
  onSave,
  notification,
}: CreateAnnouncementModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    message: "",
    audience: "",
    type: "",
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title,
        message: notification.message,
        audience: notification.audience,
        type: notification.type,
        file: notification.file || null,
        attachments: notification.attachments || [],
      });
    } else {
      setFormData({
        title: "",
        message: "",
        audience: "",
        type: "",
        file: null,
        attachments: [],
      });
    }
    setErrors({});
  }, [notification, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }
    if (!formData.audience) {
      newErrors.audience = "Target audience is required";
    }
    if (!formData.type) newErrors.type = "Type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const notificationData: Omit<Notification, "id" | "createdAt"> = {
      title: formData.title.trim(),
      message: formData.message.trim(),
      audience: formData.audience,
      type: formData.type,
      file: formData.file ?? null,
    };
    console.log("Submitting notification:", notificationData);
    console.log("File included:", !!formData.file);
    onSave(notificationData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
     
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit");
        return;
      }
      const newAttachment = {
        name: file.name,
        type: file.type.startsWith("image/") ? "Image" : "File",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      };
      setFormData((prev) => ({
        ...prev,
        file,
        attachments: [newAttachment],
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      file: null,
      attachments: [],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {notification ? "Edit Announcement" : "Create New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              General Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                  if (errors.title)
                    setErrors((prev) => ({ ...prev, title: "" }));
                }}
                placeholder="Enter announcement title"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, message: e.target.value }));
                  if (errors.message)
                    setErrors((prev) => ({ ...prev, message: "" }));
                }}
                placeholder="Enter your announcement message..."
                rows={4}
                className={errors.message ? "border-destructive" : ""}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              File Attachments
            </h3>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload images or PDFs (max 10MB each)
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({file.size})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target Audience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Target Audience
            </h3>

            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={formData.audience}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, audience: value }));
                  if (errors.audience)
                    setErrors((prev) => ({ ...prev, audience: "" }));
                }}
              >
                <SelectTrigger
                  className={errors.audience ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.audience && (
                <p className="text-sm text-destructive">{errors.audience}</p>
              )}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, type: value }));
                if (errors.type) setErrors((prev) => ({ ...prev, type: "" }));
              }}
            >
              <SelectTrigger
                className={errors.type ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="sm:flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="sm:flex-1">
            Send Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
