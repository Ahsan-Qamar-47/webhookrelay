import { useState, useEffect, useRef, useCallback } from 'react';

export function useEventsStream({ endpointId, token = 'dev-token', wsUrl = 'ws://localhost:8082' }) {
  const [liveEvents, setLiveEvents] = useState([]);
  const [newEventCount, setNewEventCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const targetUrl = `${wsUrl}?endpoint=${endpointId || 'dev-tunnel'}&token=${token}`;
    let socket = null;
    let isSubscribed = true;

    try {
      socket = new WebSocket(targetUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isSubscribed) {
          setIsConnected(true);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'EVENT' || data.type === 'EVENT_NEW') {
            const rawEvent = data.payload;
            const formattedEvent = {
              id: rawEvent.id || `evt_${Date.now()}`,
              timestamp: 'Just now',
              method: rawEvent.method || 'POST',
              path: rawEvent.path || rawEvent.destination_url || '/api/webhooks/incoming',
              status: rawEvent.response_status || rawEvent.status || 200,
              statusText: rawEvent.response_status === 500 ? 'Internal Error' : 'OK',
              latency: `${rawEvent.latency_ms || 15}ms`,
              source: rawEvent.provider || rawEvent.source || 'Incoming Webhook',
              receivedAt: rawEvent.received_at || new Date().toISOString(),
              payload: rawEvent.payload || {},
              headers: rawEvent.headers || {},
            };

            if (autoRefresh) {
              setLiveEvents((prev) => [formattedEvent, ...prev]);
            } else {
              setNewEventCount((prev) => prev + 1);
            }
          }
        } catch (err) {
          console.error('[WS Parse Error]', err);
        }
      };

      socket.onerror = () => {
        if (isSubscribed) {
          setIsConnected(false);
        }
      };

      socket.onclose = () => {
        if (isSubscribed) {
          setIsConnected(false);
        }
      };
    } catch (err) {
      console.error('[WS Init Error]', err);
    }

    return () => {
      isSubscribed = false;
      if (socket) {
        socket.close();
      }
    };
  }, [endpointId, token, wsUrl, autoRefresh]);

  const flushNewEvents = useCallback(() => {
    setNewEventCount(0);
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh((prev) => !prev);
  }, []);

  return {
    liveEvents,
    newEventCount,
    autoRefresh,
    isConnected,
    toggleAutoRefresh,
    flushNewEvents,
    setLiveEvents,
  };
}
