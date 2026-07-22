import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "@/constants/apiEndpoints";

const getWsUrl = () => {
  const base = API_BASE_URL.replace(/\/v1\/?$/, "");
  const wsProto = base.startsWith("https") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "");
  return `${wsProto}://${host}/ws/support`;
};

export interface UseSupportSocketOptions {
  brokerId?: number;
  ticketId?: number;
  onNewReply?: (reply: any, ticketId: number) => void;
  onNewTicket?: (ticket: any) => void;
  onStatusChange?: (ticketId: number, status: string) => void;
}

export const useSupportSocket = ({
  brokerId = 1,
  ticketId,
  onNewReply,
  onNewTicket,
  onStatusChange,
}: UseSupportSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    let pingInterval: NodeJS.Timeout;

    ws.onopen = () => {
      setIsConnected(true);

      // Subscribe to broker admin channel
      if (brokerId) {
        ws.send(JSON.stringify({ type: "subscribe_broker", brokerId }));
      }

      // Subscribe to active ticket room
      if (ticketId) {
        ws.send(JSON.stringify({ type: "subscribe_ticket", ticketId }));
      }

      // Heartbeat ping every 25 seconds
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "new_reply":
            if (onNewReply) onNewReply(data.reply, data.ticketId);
            break;
          case "new_ticket":
            if (onNewTicket) onNewTicket(data.ticket);
            break;
          case "ticket_status_changed":
            if (onStatusChange) onStatusChange(data.ticketId, data.status);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("[SupportWS Admin] Error parsing message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      clearInterval(pingInterval);
    };

    ws.onerror = (error) => {
      console.error("[SupportWS Admin] Error:", error);
    };

    return () => {
      clearInterval(pingInterval);
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [brokerId, ticketId]);

  const subscribeTicket = useCallback((id: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "subscribe_ticket", ticketId: id })
      );
    }
  }, []);

  const unsubscribeTicket = useCallback((id: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "unsubscribe_ticket", ticketId: id })
      );
    }
  }, []);

  return { isConnected, subscribeTicket, unsubscribeTicket };
};
