import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
import EventList from '../components/events/EventList';
import EventTimeline from '../components/events/EventTimeline';
import { useEventsStream } from '../hooks/useEventsStream';

const initialMockEvents = [
  { id: 'evt_2001', timestamp: '12s ago', method: 'POST', path: '/api/webhooks/stripe', status: 200, statusText: 'OK', latency: '19ms', source: 'stripe' },
  { id: 'evt_2002', timestamp: '1m ago', method: 'POST', path: '/api/webhooks/github', status: 200, statusText: 'OK', latency: '24ms', source: 'github' },
  { id: 'evt_2003', timestamp: '3m ago', method: 'GET', path: '/api/healthcheck', status: 200, statusText: 'OK', latency: '11ms', source: 'generic' },
  { id: 'evt_2004', timestamp: '6m ago', method: 'POST', path: '/api/webhooks/shopify', status: 500, statusText: 'Internal Error', latency: '154ms', source: 'shopify' },
  { id: 'evt_2005', timestamp: '9m ago', method: 'PUT', path: '/api/users/sync', status: 200, statusText: 'OK', latency: '32ms', source: 'generic' },
  { id: 'evt_2006', timestamp: '14m ago', method: 'POST', path: '/api/webhooks/stripe', status: 200, statusText: 'OK', latency: '21ms', source: 'stripe' },
  { id: 'evt_2007', timestamp: '20m ago', method: 'DELETE', path: '/api/subscriptions/cancel', status: 404, statusText: 'Not Found', latency: '16ms', source: 'generic' },
  { id: 'evt_2008', timestamp: '28m ago', method: 'POST', path: '/api/webhooks/twilio', status: 200, statusText: 'OK', latency: '20ms', source: 'twilio' },
  { id: 'evt_2009', timestamp: '35m ago', method: 'POST', path: '/api/webhooks/github', status: 200, statusText: 'OK', latency: '28ms', source: 'github' },
  { id: 'evt_2010', timestamp: '42m ago', method: 'POST', path: '/api/webhooks/whatsapp', status: 200, statusText: 'OK', latency: '22ms', source: 'whatsapp' },
  { id: 'evt_2011', timestamp: '50m ago', method: 'POST', path: '/api/webhooks/slack', status: 200, statusText: 'OK', latency: '17ms', source: 'slack' },
  { id: 'evt_2012', timestamp: '1h ago', method: 'POST', path: '/api/webhooks/segment', status: 200, statusText: 'OK', latency: '25ms', source: 'generic' },
];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState(searchParams.get('method') || '');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || '');
  const [sourceSearch, setSourceSearch] = useState('');

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = {};
    if (sourceFilter) params.source = sourceFilter;
    if (methodFilter) params.method = methodFilter;
    setSearchParams(params, { replace: true });
  }, [sourceFilter, methodFilter, setSearchParams]);

  const {
    liveEvents,
    newEventCount,
    autoRefresh,
    toggleAutoRefresh,
    flushNewEvents
  } = useEventsStream({ endpointId: 'dev-tunnel' });

  // Combine live stream events and initial dataset
  const allEvents = useMemo(() => {
    return [...liveEvents, ...initialMockEvents];
  }, [liveEvents]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      const matchesMethod = methodFilter === '' || evt.method === methodFilter;
      const matchesSourceDropdown =
        sourceFilter === '' ||
        (evt.source || '').toLowerCase().includes(sourceFilter.toLowerCase());
      const matchesSearch =
        sourceSearch === '' ||
        (evt.source || '').toLowerCase().includes(sourceSearch.toLowerCase()) ||
        (evt.path || '').toLowerCase().includes(sourceSearch.toLowerCase());
      return matchesMethod && matchesSourceDropdown && matchesSearch;
    });
  }, [allEvents, methodFilter, sourceFilter, sourceSearch]);

  // Pagination slicing
  const limit = 10;
  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredEvents.slice(start, start + limit);
  }, [filteredEvents, page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-relay-purple-light" />
            Events Inspector Feed
          </h1>
          <p className="text-relay-subtext text-sm mt-1">
            Real-time feed of all incoming HTTP webhook requests routed through relay.
          </p>
        </div>
      </div>

      <EventTimeline events={allEvents} />

      <EventList
        events={paginatedEvents}
        totalCount={filteredEvents.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        sourceSearch={sourceSearch}
        onSourceSearchChange={setSourceSearch}
        newEventCount={newEventCount}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        onFlushNewEvents={flushNewEvents}
      />
    </div>
  );
}
