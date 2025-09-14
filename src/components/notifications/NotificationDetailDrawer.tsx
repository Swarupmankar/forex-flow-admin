import { X, Paperclip, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Notification } from "@/pages/Notifications";
import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
// import type { Notification } from "@/pages/Notifications";

interface NotificationDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export function NotificationDetailDrawer({
  isOpen,
  onClose,
  notification,
}: NotificationDetailDrawerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fullImageOpen, setFullImageOpen] = useState(false);
  if (!notification) return null;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "SECURITY":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Security
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Update
          </Badge>
        );
      case "PROMOTION":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Promotion
          </Badge>
        );
      case "ALERT":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
            Alert
          </Badge>
        );
      case "MAINTENANCE":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[400px] sm:w-[420px]">
          <SheetHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <SheetTitle className="text-left line-clamp-2">
                  {notification.title}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getTypeBadge(notification.type)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Audience & Date Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Target Audience
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.audience}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Created on
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(notification.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Message Content */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Message</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {notification.attachments &&
              notification.attachments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Attachments
                    </h3>
                    <div className="space-y-2">
                      {notification.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attachment.type} • {attachment.size}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewOpen(!previewOpen)}
                          >
                            {previewOpen ? "Hide" : "View"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {previewOpen && notification.fileAttachedUrl && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      {notification.fileAttachedUrl.match(
                        /\.(jpg|jpeg|png|gif|webp)$/i
                      ) ? (
                        <img
                          src={notification.fileAttachedUrl}
                          alt="Attachment"
                          className="w-full h-auto cursor-pointer"
                          onClick={() => setFullImageOpen(true)} // 🔥 open full modal on click
                        />
                      ) : (
                        <iframe
                          src={notification.fileAttachedUrl}
                          className="w-full h-64"
                          title="Attachment Preview"
                        />
                      )}
                    </div>
                  )}
                </>
              )}

            <Separator />

            {/* Additional Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Created:{" "}
                  {format(notification.createdAt, "MMM dd, yyyy 'at' HH:mm")}
                </p>
                <p>ID: {notification.id}</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Fullscreen Image Modal */}
      <Dialog open={fullImageOpen} onOpenChange={setFullImageOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black">
          {notification?.fileAttachedUrl && (
            <img
              src={notification.fileAttachedUrl}
              alt="Full Preview"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
