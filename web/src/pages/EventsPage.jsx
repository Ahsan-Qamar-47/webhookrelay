import { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import EventList from '../components/events/EventList';
import { useEventsStream } from '../hooks/useEventsStream';

const initialMockEvents = [
  { id: 'evt_2001', timestamp: '12s ago', method: 'POST', path: '/api/webhooks/stripe', status: 200, statusText: 'OK', latency: '19ms', source: 'Stripe / invoice.paid' },
  { id: 'evt_2002', timestamp: '1m ago', method: 'POST', path: '/api/webhooks/github', status: 200, statusText: 'OK', latency: '24ms', source: 'GitHub / push' },
  { id: 'evt_2003', timestamp: '3m ago', method: 'GET', path: '/api/healthcheck', status: 200, statusText: 'OK', latency: '11ms', source: 'Health Ping' },
  { id: 'evt_2004', timestamp: '6m ago', method: 'POST', path: '/api/webhooks/shopify', status: 500, statusText: 'Internal Error', latency: '154ms', source: 'Shopify / order.created' },
  { id: 'evt_2005', timestamp: '9m ago', method: 'PUT', path: '/api/users/sync', status: 200, statusText: 'OK', latency: '32ms', source: 'Auth0 / user.updated' },
  { id: 'evt_2006', timestamp: '14m ago', method: 'POST', path: '/api/webhooks/stripe', status: 200, statusText: 'OK', latency: '21ms', source: 'Stripe / payment.succeeded' },
  { id: 'evt_2007', timestamp: '20m ago', method: 'DELETE', path: '/api/subscriptions/cancel', status: 404, statusText: 'Not Found', latency: '16ms', source: 'Custom Client' },
  { id: 'evt_2008', timestamp: '28m ago', method: 'POST', path: '/api/webhooks/twilio', status: 200, statusText: 'OK', latency: '20ms', source: 'Twilio / sms.received' },
  { id: 'evt_2009', timestamp: '35m ago', method: 'POST', path: '/api/webhooks/github', status: 200, statusText: 'OK', latency: '28ms', source: 'GitHub / pull_request.opened' },
  { id: 'evt_2010', timestamp: '42m ago', method: 'POST', path: '/api/webhooks/stripe', status: 200, statusText: 'OK', latency: '22ms', source: 'Stripe / customer.created' },
  { id: 'evt_2011', timestamp: '50m ago', method: 'POST', path: '/api/webhooks/slack', status: 200, statusText: 'OK', latency: '17ms', source: 'Slack / message.posted' },
  { id: 'evt_2012', timestamp: '1h ago', method: 'POST', path: '/api/webhooks/segment', status: 200, statusText: 'OK', latency: '25ms', source: 'Segment / track' },
];

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');

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
      const matchesSource =
        sourceSearch === '' ||
        evt.source.toLowerCase().includes(sourceSearch.toLowerCase()) ||
        evt.path.toLowerCase().includes(sourceSearch.toLowerCase());
      return matchesMethod && matchesSource;
    });
  }, [allEvents, methodFilter, sourceSearch]);

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

      <EventList
        events={paginatedEvents}
        totalCount={filteredEvents.length}
        page={page}
        limit={limit}
        onPageChange={setPage}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
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
