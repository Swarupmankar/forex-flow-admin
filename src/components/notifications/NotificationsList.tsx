import { Eye, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import type { Notification } from "@/pages/Notifications";

interface NotificationsListProps {
  notifications: Notification[];
  onView: (notification: Notification) => void;
  onEdit: (notification: Notification) => void;
  onDelete: (id: string) => void;
}

export function NotificationsList({
  notifications,
  onView,
  onEdit,
  onDelete,
}: NotificationsListProps) {
  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy 'at' HH:mm");
  };

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

  if (notifications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No notifications found matching your criteria.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Types</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow
                key={notification.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div>
                    <p className="font-semibold text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {notification.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground">
                    {notification.audience}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground">
                    {formatDate(notification.createdAt)}
                  </span>
                </TableCell>
                <TableCell>{getTypeBadge(notification.type)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(notification)}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(notification)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Notification
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "
                            {notification.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(notification.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
