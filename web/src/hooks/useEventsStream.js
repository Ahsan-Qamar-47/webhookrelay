import { useState, useEffect, useRef, useCallback } from 'react';

export function useEventsStream({ endpointId, token = 'dev-token', wsUrl = 'ws://localhost:8082' }) {
  const [liveEvents, setLiveEvents] = useState([]);
  const [newEventCount, setNewEventCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef(null);
  const autoRefreshRef = useRef(autoRefresh);

  // Keep autoRefreshRef synchronized without triggering reconnection
  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

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
            const rawEvent = data.payload || data.data || {};
            const formattedEvent = {
              id: rawEvent.id || `evt_${Date.now()}`,
              timestamp: 'Just now',
              method: rawEvent.method || 'POST',
              path: rawEvent.path || rawEvent.subdomain ? `/ingest/${rawEvent.subdomain}` : '/api/webhooks/incoming',
              status: rawEvent.response_status || rawEvent.status || 200,
              statusText: (rawEvent.response_status || rawEvent.status || 200) >= 400 ? 'Error' : 'OK',
              latency: `${rawEvent.latency_ms || 15}ms`,
              source: rawEvent.provider || rawEvent.source || 'generic',
              receivedAt: rawEvent.received_at || new Date().toISOString(),
              payload: rawEvent.payload || rawEvent.body || {},
              headers: rawEvent.headers || {},
            };

            if (autoRefreshRef.current) {
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
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      }
    };
  }, [endpointId, token, wsUrl]);

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
