import { Toast } from "@/components/ui/Toast";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";

type EventHandler = (data: any) => void;

type EventMap = {
  [event: string]: Set<EventHandler>;
};

type SocketToastPayload = {
  type: "success" | "error" | "info";
  text1: string;
  text2?: string;
};

type SocketToastResolver = (data: any) => SocketToastPayload | null;

const SOCKET_TOASTS: Record<string, SocketToastResolver> = {
  "sensor:alert": (data) => {
    if (!data?.alert) return null;
    return {
      type: "error",
      text1: data.alert,
      text2: data.text,
    };
  },
  "sensor:normal": (data) => ({
    type: "info",
    text1: "Cảnh báo đã được giải quyết",
    text2: data?.text,
  }),
  "motion:alert": (data) => {
    if (!data?.alert) return null;
    return {
      type: "error",
      text1: data.alert,
      text2: data.text,
    };
  },
};

interface SocketContextType {
  socket: Socket | null;
  subscribe: (event: string, handler: EventHandler) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<EventMap>({});

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    console.log("Socket connected:", SERVER_URL);

    socket.onAny((event, data) => {
      const toastResolver = SOCKET_TOASTS[event];
      if (toastResolver) {
        const toastPayload = toastResolver(data);
        if (toastPayload) {
          Toast.show(toastPayload);
        }
      }

      const handlers = listenersRef.current[event];
      if (handlers) {
        handlers.forEach((cb) => cb(data));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribe = (event: string, handler: EventHandler) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = new Set();
    }

    listenersRef.current[event].add(handler);

    // unsubscribe function
    return () => {
      listenersRef.current[event].delete(handler);
    };
  };

  const contextValue = useMemo(
    () => ({
      socket: socketRef.current,
      subscribe,
    }),
    [],
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside SocketProvider");
  return context;
};
