// // features/notifications/notifications.api.ts
// import { baseApi } from "@/API/baseApi";
// import { ENDPOINTS } from "@/constants/apiEndpoints";
// import type {
//   Notification,
//   GetNotificationsResponse,
//   CreateNotificationRequest,
//   CreateNotificationResponse,
//   UpdateNotificationRequest,
//   UpdateNotificationResponse,
//   DeleteNotificationResponse,
// } from "@/features/notifications/notifications.types";

// export const notificationsApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({
//     // 📌 Get all notifications
//     getNotifications: build.query<GetNotificationsResponse, void>({
//       query: () => ({
//         url: ENDPOINTS.NOTIFICATIONS.ALL,
//         method: "GET",
//       }),
//       providesTags: ["Notifications"],
//     }),

//     // 📌 Create notification
//     createNotification: build.mutation<
//       CreateNotificationResponse,
//       CreateNotificationRequest
//     >({
//       query: ({ title, description, targetAudience, type, file }) => {
//         const formData = new FormData();
//         formData.append("title", title);
//         formData.append("description", description);
//         formData.append("targetAudience", targetAudience);
//         formData.append("type", type);
//         if (file) {
//           console.log("📂 Appending file:", file);
//           formData.append("file", file);
//         }

//         console.log("🚀 FormData (create):");
//         for (const [key, value] of formData.entries()) {
//           console.log(key, value);
//         }
//         return {
//           url: ENDPOINTS.NOTIFICATIONS.CREATE,
//           method: "POST",
//           data: formData,
//         };
//       },
//       invalidatesTags: ["Notifications"],
//     }),

//     // 📌 Update notification
//     updateNotification: build.mutation<
//       UpdateNotificationResponse,
//       UpdateNotificationRequest
//     >({
//       query: ({ id, title, description, targetAudience, type, file }) => {
//         const formData = new FormData();
//         formData.append("userNotificationId", id.toString());
//         formData.append("title", title);
//         formData.append("description", description);
//         formData.append("targetAudience", targetAudience);
//         formData.append("type", type);
//         if (file) {
//           console.log("📂 Appending file:", file);
//           formData.append("file", file);
//         }

//         console.log("🚀 FormData (update):");
//         for (const [key, value] of formData.entries()) {
//           console.log(key, value);
//         }

//         return {
//           url: ENDPOINTS.NOTIFICATIONS.UPDATE,
//           method: "PUT",
//           data: formData,
//         };
//       },
//       invalidatesTags: ["Notifications"],
//     }),

//     // 📌 Delete notification
//     deleteNotification: build.mutation<DeleteNotificationResponse, number>({
//       query: (id) => ({
//         url: ENDPOINTS.NOTIFICATIONS.DELETE(id),
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Notifications"],
//     }),
//   }),
// });

// export const {
//   useGetNotificationsQuery,
//   useCreateNotificationMutation,
//   useUpdateNotificationMutation,
//   useDeleteNotificationMutation,
// } = notificationsApi;

// features/notifications/notifications.api.ts
import { baseApi } from "@/API/baseApi";
import { ENDPOINTS } from "@/constants/apiEndpoints";
import type {
  Notification,
  GetNotificationsResponse,
  CreateNotificationRequest,
  CreateNotificationResponse,
  UpdateNotificationRequest,
  UpdateNotificationResponse,
  DeleteNotificationResponse,
  NotificationCatalogResponse,
  BroadcastNotificationRequest,
  BroadcastNotificationResponse,
} from "@/features/notifications/notifications.types";

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // 📌 Get all notifications
    getNotifications: build.query<GetNotificationsResponse, void>({
      query: () => ({
        url: ENDPOINTS.NOTIFICATIONS.ALL,
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),

    // 📌 Get notification catalog for super-admin broadcast
    getNotificationCatalog: build.query<NotificationCatalogResponse, void>({
      query: () => ({
        url: ENDPOINTS.ADMIN_NOTIFICATION.CATALOG,
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),

    // 📌 Broadcast system notification to all users
    broadcastNotification: build.mutation<
      BroadcastNotificationResponse,
      BroadcastNotificationRequest
    >({
      query: (body) => ({
        url: ENDPOINTS.ADMIN_NOTIFICATION.BROADCAST,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Notifications"],
    }),

    // 📌 Create notification
    createNotification: build.mutation<
      CreateNotificationResponse,
      CreateNotificationRequest
    >({
      query: (data) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description); // Note: changed from description to message
        formData.append("targetAudience", data.targetAudience);
        formData.append("type", data.type);

        // Append file if it exists
        if (data.file) {
          console.log("📂 Appending file:", data.file);
          formData.append("file", data.file);
        }

        console.log("🚀 FormData (create):");
        for (const [key, value] of formData.entries()) {
          console.log(key, value);
        }

        return {
          url: ENDPOINTS.NOTIFICATIONS.CREATE,
          method: "POST",
          data: formData,
          headers: {
            // Don't set Content-Type - let the browser set it with the boundary
          },
        };
      },
      invalidatesTags: ["Notifications"],
    }),

    // 📌 Update notification
    updateNotification: build.mutation<
      UpdateNotificationResponse,
      UpdateNotificationRequest
    >({
      query: (data) => {
        const formData = new FormData();
        formData.append("userNotificationId", data.id.toString());
        formData.append("title", data.title);
        formData.append("description", data.description); // Note: changed from description to message
        formData.append("targetAudience", data.targetAudience);
        formData.append("type", data.type);

        // Append file if it exists
        if (data.file) {
          console.log("📂 Appending file:", data.file);
          formData.append("file", data.file);
        }

        console.log("🚀 FormData (update):");
        for (const [key, value] of formData.entries()) {
          console.log(key, value);
        }

        return {
          url: ENDPOINTS.NOTIFICATIONS.UPDATE,
          method: "PUT",
          data: formData,
          headers: {
            // Don't set Content-Type - let the browser set it with the boundary
          },
        };
      },
      invalidatesTags: ["Notifications"],
    }),

    // 📌 Delete notification
    deleteNotification: build.mutation<DeleteNotificationResponse, number>({
      query: (id) => ({
        url: ENDPOINTS.NOTIFICATIONS.DELETE(id),
        method: "DELETE",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetNotificationCatalogQuery,
  useBroadcastNotificationMutation,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
} = notificationsApi;

