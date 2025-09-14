import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsFilters } from "@/components/notifications/NotificationsFilters";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { CreateAnnouncementModal } from "@/components/notifications/CreateAnnouncementModal";
import { NotificationDetailDrawer } from "@/components/notifications/NotificationDetailDrawer";
import { exportNotifications } from "@/lib/table-exports";
import {
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useUpdateNotificationMutation,
} from "@/API/notifications.api";
import type { Notification as ApiNotification } from "@/features/notifications/notifications.types";
import { useToast } from "@/components/ui/use-toast";

export type Notification = {
  id: string;
  title: string;
  fileAttachedUrl?: string;
  message: string;
  audience: string;
  createdAt: Date;
  type: string;
  attachments?: Array<{ name: string; type: string; size: string }>;
  file?: File | null;
};

export default function Notifications() {
  const { toast } = useToast();
  const { data: apiNotifications, isLoading } = useGetNotificationsQuery();
  const [createNotification] = useCreateNotificationMutation();
  const [updateNotification] = useUpdateNotificationMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [editingNotification, setEditingNotification] =
    useState<Notification | null>(null);

  // 🔄 Transform API → UI
  const notifications: Notification[] =
    apiNotifications?.map((n: ApiNotification) => ({
      id: n.id.toString(),
      title: n.title,
      message: n.description,
      audience: n.targetAudience.replace(/_/g, " "),
      type: n.type,
      createdAt: new Date(n.createdAt),
      fileAttachedUrl: n.fileAttachedUrl,
      attachments: n.fileAttachedUrl
        ? [
            {
              name: n.fileAttachedUrl.split("/").pop() || "file",
              type: "File",
              size: "-",
            },
          ]
        : undefined,
    })) ?? [];

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.audience.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange =
      !dateRange.from ||
      !dateRange.to ||
      (notification.createdAt >= dateRange.from &&
        notification.createdAt <= dateRange.to);

    return matchesSearch && matchesDateRange;
  });

  const handleCreateNotification = async (
    notificationData: Omit<Notification, "id" | "createdAt">
  ) => {
    try {
      await createNotification({
        title: notificationData.title,
        description: notificationData.message, // Not description
        targetAudience: notificationData.audience, // Not targetAudience
        type: notificationData.type,
        file: notificationData.file,
      }).unwrap();
      toast({
        title: "✅ Notification Created",
        description: "Your notification has been successfully created.",
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      toast({
        title: "❌ Failed to Create",
        description: "Something went wrong while creating the notification.",
        variant: "destructive",
      });
    }
  };

  const handleEditNotification = async (
    data: Omit<Notification, "id" | "createdAt">
  ) => {
    if (editingNotification) {
      try {
        await updateNotification({
          id: Number(editingNotification.id),
          title: data.title,
          description: data.message,
          targetAudience: data.audience,
          type: data.type,
          file: data.file,
        }).unwrap();
        toast({
          title: "✅ Notification Updated",
          description: "Your notification has been successfully updated.",
        });
        setEditingNotification(null);
        setIsCreateModalOpen(false);
      } catch (error) {
        toast({
          title: "❌ Failed to Update",
          description: "Something went wrong while updating the notification.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(Number(id)).unwrap();
      toast({
        title: "🗑️ Notification Deleted",
        description: "The notification has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "❌ Failed to Delete",
        description: "Something went wrong while deleting the notification.",
        variant: "destructive",
      });
    }
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailDrawerOpen(true);
  };

  const handleEditClick = (notification: Notification) => {
    setEditingNotification(notification);
    setIsCreateModalOpen(true);
  };

  const handleExport = (format: "csv" | "pdf") => {
    const exportData = filteredNotifications.map((n) => ({
      ...n,
      sentDate: n.createdAt,
    }));
    exportNotifications(exportData, format);
    toast({
      title: "📤 Export Complete",
      description: `Notifications exported as ${format.toUpperCase()}.`,
    });
  };

  return (
    <DashboardLayout title="Notifications & Broadcasts">
      <div className="space-y-6">
        <NotificationsHeader
          onCreateClick={() => setIsCreateModalOpen(true)}
          onExport={handleExport}
        />

        <NotificationsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter="all"
          onStatusFilterChange={() => {}}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {isLoading ? (
          <p>Loading notifications...</p>
        ) : (
          <NotificationsList
            notifications={filteredNotifications}
            onView={handleViewNotification}
            onEdit={handleEditClick}
            onDelete={handleDeleteNotification}
          />
        )}

        <CreateAnnouncementModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingNotification(null);
          }}
          onSave={
            editingNotification
              ? handleEditNotification
              : handleCreateNotification
          }
          notification={editingNotification}
        />

        <NotificationDetailDrawer
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          notification={selectedNotification}
        />
      </div>
    </DashboardLayout>
  );
}
