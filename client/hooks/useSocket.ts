import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, { transports: ["websocket"] });
    return () => { socketRef.current?.disconnect(); };
  }, []);

  return socketRef.current;
};