import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseSocketOptions {
  userId?: string;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { userId, autoConnect = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!autoConnect || !userId) return;

    const newSocket = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected');
      setIsConnected(true);
      // Join user-specific room
      newSocket.emit('join_room', `user_${userId}`);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, autoConnect]);

  const on = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      socket?.on(event, callback);
      return () => socket?.off(event, callback);
    },
    [socket]
  );

  const emit = useCallback(
    (event: string, data?: any) => {
      socket?.emit(event, data);
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    on,
    emit,
  };
}
