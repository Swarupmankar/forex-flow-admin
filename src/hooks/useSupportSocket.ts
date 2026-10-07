import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL } from "@/constants/apiEndpoints";
import { endSession } from "@/lib/session";

// The server refuses a socket without a valid BROKER access token with 1008.
const AUTH_REFUSED = 1008;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

/**
 * Browsers cannot set headers on a WebSocket, so the access token goes in the
 * query string, which the server reads (support-socket.ts extractToken).
 */
const getWsUrl = (token: string) => {
  const base = API_BASE_URL.replace(/\/v1\/?$/, "");
  const wsProto = base.startsWith("https") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "");
  return `${wsProto}://${host}/ws/support?token=${encodeURIComponent(token)}`;
};

/** The logged-in broker's id: the server only lets a broker follow its own room. */
const currentBrokerId = (): number | null => {
  try {
    const id = Number(JSON.parse(localStorage.getItem("user") || "null")?.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
};

export interface UseSupportSocketOptions {
  ticketId?: number;
  onNewReply?: (reply: unknown, ticketId: number) => void;
  onNewTicket?: (ticket: unknown) => void;
  onStatusChange?: (ticketId: number, status: string) => void;
  /** After a reconnect: events sent while disconnected were missed, so refetch. */
  onReconnect?: () => void;
}

export const useSupportSocket = ({
  ticketId,
  onNewReply,
  onNewTicket,
  onStatusChange,
  onReconnect,
}: UseSupportSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);
  const ticketRef = useRef<number | undefined>(ticketId);
  const [isConnected, setIsConnected] = useState(false);

  // Latest callbacks without reconnecting when they change.
  const callbacks = useRef({ onNewReply, onNewTicket, onStatusChange, onReconnect });
  callbacks.current = { onNewReply, onNewTicket, onStatusChange, onReconnect };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const brokerId = currentBrokerId();
    if (!token || !brokerId) return;

    let closed = false;
    let attempt = 0;
    let everConnected = false;
    let pingInterval: ReturnType<typeof setInterval> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (closed) return;
      const ws = new WebSocket(getWsUrl(token));
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        attempt = 0;
        ws.send(JSON.stringify({ type: "subscribe_broker", brokerId }));
        if (ticketRef.current) {
          ws.send(JSON.stringify({ type: "subscribe_ticket", ticketId: ticketRef.current }));
        }
        if (everConnected) callbacks.current.onReconnect?.();
        everConnected = true;

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "new_reply":
              callbacks.current.onNewReply?.(data.reply, data.ticketId);
              break;
            case "new_ticket":
              callbacks.current.onNewTicket?.(data.ticket);
              break;
            case "ticket_status_changed":
              callbacks.current.onStatusChange?.(data.ticketId, data.status);
              break;
            default:
              break;
          }
        } catch (err) {
          console.error("[SupportWS Admin] Error parsing message:", err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        clearInterval(pingInterval);
        if (closed) return;
        // The token was refused: the session is over, like a 401 from the API.
        if (event.code === AUTH_REFUSED) {
          endSession("unauthorized");
          return;
        }
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose follows and decides whether to retry.
      };
    };

    connect();

    return () => {
      closed = true;
      clearInterval(pingInterval);
      clearTimeout(retryTimer);
      const ws = socketRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close(1000);
      }
      socketRef.current = null;
    };
  }, []);

  // Following another ticket changes the room, not the connection.
  useEffect(() => {
    const previous = ticketRef.current;
    ticketRef.current = ticketId;
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || previous === ticketId) return;
    if (previous) ws.send(JSON.stringify({ type: "unsubscribe_ticket", ticketId: previous }));
    if (ticketId) ws.send(JSON.stringify({ type: "subscribe_ticket", ticketId }));
  }, [ticketId]);

  const subscribeTicket = useCallback((id: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "subscribe_ticket", ticketId: id }));
    }
  }, []);

  const unsubscribeTicket = useCallback((id: number) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "unsubscribe_ticket", ticketId: id }));
    }
  }, []);

  return { isConnected, subscribeTicket, unsubscribeTicket };
};
