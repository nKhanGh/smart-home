import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

type EventHandler = (data: any) => void;

type EventMap = {
  [event: string]: Set<EventHandler>;
};

interface SocketContextType {
  socket: Socket | null;
  subscribe: (event: string, handler: EventHandler) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<EventMap>({});

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    console.log("Socket connected:", SERVER_URL);

    socket.onAny((event, data) => {
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

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        subscribe,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside SocketProvider");
  return context;
};