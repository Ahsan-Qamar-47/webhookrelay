import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Code, 
  FileText, 
  Sliders, 
  RotateCw, 
  GitCompare 
} from 'lucide-react';

import EventHeader from '../components/events/EventHeader';
import JsonViewer from '../components/events/JsonViewer';
import HeadersViewer from '../components/events/HeadersViewer';
import QueryParams from '../components/events/QueryParams';
import JsonDiff from '../components/events/JsonDiff';
import CompareModal from '../components/events/CompareModal';
import EventTimeline from '../components/events/EventTimeline';

const sampleComparisonEvents = [
  {
    id: 'evt_1091',
    method: 'POST',
    path: '/api/webhooks/github',
    source: 'GitHub / push',
    payload: {
      id: 'evt_1M001A2eZvKYlo2C9990123',
      object: 'event',
      api_version: '2022-11-15',
      created: 1672531199,
      data: {
        object: {
          id: 'in_1M001A2eZvKYlo2C9990123',
          object: 'invoice',
          amount_due: 5900, // Modified from 4900
          amount_paid: 5900,
          currency: 'usd',
          customer: 'cus_N1892837492',
          customer_email: 'alex.developer@example.com',
          paid: true,
          status: 'paid',
          subscription: 'sub_1M001A2eZvKYlo2C',
          tax: 1000, // Added field
        },
      },
      type: 'invoice.updated', // Modified
    },
  },
  {
    id: 'evt_1090',
    method: 'GET',
    path: '/api/healthcheck',
    source: 'Health Check',
    payload: {
      status: 'ok',
      timestamp: Date.now(),
    },
  },
];

const mockEventDetails = {
  evt_1092: {
    id: 'evt_1092',
    endpoint_id: 'ep_dev_01',
    event_id: 'stripe_evt_9901',
    provider: 'Stripe',
    source: 'Stripe / invoice.paid',
    method: 'POST',
    path: '/api/webhooks/stripe',
    ip_address: '54.187.205.12',
    status: 200,
    statusText: 'OK',
    latency_ms: 18,
    received_at: new Date().toISOString(),
    headers: {
      'host': 'relay.local:8080',
      'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
      'content-type': 'application/json; charset=utf-8',
      'stripe-signature': 't=1672531199,v1=99a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
      'x-forwarded-for': '54.187.205.12',
      'accept-encoding': 'gzip, deflate',
    },
    payload: {
      id: 'evt_1M001A2eZvKYlo2C9990123',
      object: 'event',
      api_version: '2022-11-15',
      created: 1672531199,
      data: {
        object: {
          id: 'in_1M001A2eZvKYlo2C9990123',
          object: 'invoice',
          amount_due: 4900,
          amount_paid: 4900,
          currency: 'usd',
          customer: 'cus_N1892837492',
          customer_email: 'alex.developer@example.com',
          paid: true,
          status: 'paid',
          subscription: 'sub_1M001A2eZvKYlo2C',
        },
      },
      type: 'invoice.paid',
    },
    query: {
      livemode: 'false',
      source_app: 'checkout',
      attempt: '1',
    },
    replay_history: [
      {
        id: 'rep_001',
        target_url: 'http://localhost:3000/api/webhooks/stripe',
        status_code: 200,
        latency_ms: 22,
        replayed_at: '5m ago',
      },
    ],
  },
};

export default function EventDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('payload');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const compareWithId = searchParams.get('compareWith');

  // Fallback data if id not in mock
  const event = mockEventDetails[id] || {
    id: id || 'evt_sample',
    endpoint_id: 'ep_dev_01',
    event_id: `evt_${id}`,
    provider: 'Stripe',
    source: 'Stripe / invoice.paid',
    method: 'POST',
    path: '/api/webhooks/stripe',
    ip_address: '127.0.0.1',
    status: 200,
    statusText: 'OK',
    latency_ms: 19,
    received_at: new Date().toISOString(),
    headers: {
      'host': 'relay.local:8080',
      'user-agent': 'WebhookRelay/1.0',
      'content-type': 'application/json',
      'stripe-signature': 't=1672531199,v1=sample_signature_hash',
    },
    payload: {
      event: 'invoice.paid',
      amount: 4900,
      currency: 'usd',
      customer: 'cus_sample123',
      status: 'success',
    },
    query: {
      test: 'true',
    },
    replay_history: [],
  };

  const targetCompareEvent = sampleComparisonEvents.find((evt) => evt.id === compareWithId) || sampleComparisonEvents[0];

  const handleSelectCompareTarget = (targetId) => {
    setSearchParams({ compareWith: targetId });
    setActiveTab('diff');
  };

  const handleOpenCompareModal = () => {
    setIsCompareModalOpen(true);
  };

  const queryClient = useQueryClient();

  const replayMutation = useMutation({
    mutationFn: async (targetEventId) => {
      const res = await fetch(`/api/events/${targetEventId}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Replay request failed');
      return res.json();
    },
    onMutate: async (targetEventId) => {
      await queryClient.cancelQueries({ queryKey: ['event', targetEventId] });
      const previousData = queryClient.getQueryData(['event', targetEventId]);

      queryClient.setQueryData(['event', targetEventId], (old) => {
        const optimisticLog = {
          id: `rep_opt_${Date.now()}`,
          target_url: old?.data?.destination_url || 'http://localhost:3000/webhook',
          status_code: 200,
          latency_ms: 14,
          replayed_at: 'Just now (optimistic)',
        };
        if (!old) return { data: { replay_history: [optimisticLog] } };
        return {
          ...old,
          data: {
            ...old.data,
            replay_history: [optimisticLog, ...(old.data?.replay_history || [])],
          },
        };
      });

      return { previousData };
    },
    onError: (err, targetEventId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['event', targetEventId], context.previousData);
      }
    },
    onSettled: (data, err, targetEventId) => {
      queryClient.invalidateQueries({ queryKey: ['event', targetEventId] });
    },
  });

  const handleReplay = (targetId) => {
    replayMutation.mutate(targetId || id);
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link 
        to="/events" 
        className="inline-flex items-center gap-2 text-xs font-semibold text-relay-subtext hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events Feed
      </Link>

      {/* Header Summary Card */}
      <EventHeader 
        event={event} 
        onReplay={handleReplay} 
        onOpenCompare={handleOpenCompareModal} 
      />

      {/* Visual Timeline Bar */}
      <EventTimeline events={sampleComparisonEvents} activeEventId={event.id} />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-relay-border/80 gap-2">
        <button
          onClick={() => setActiveTab('payload')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'payload'
              ? 'border-relay-purple text-relay-purple-light bg-relay-purple/10'
              : 'border-transparent text-relay-subtext hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Payload JSON</span>
        </button>

        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'diff'
              ? 'border-relay-purple text-relay-purple-light bg-relay-purple/10'
              : 'border-transparent text-relay-subtext hover:text-white'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>JSON Diff {compareWithId ? `(${compareWithId})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'headers'
              ? 'border-relay-purple text-relay-purple-light bg-relay-purple/10'
              : 'border-transparent text-relay-subtext hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Headers ({Object.keys(event.headers || {}).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('query')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'query'
              ? 'border-relay-purple text-relay-purple-light bg-relay-purple/10'
              : 'border-transparent text-relay-subtext hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Query Params ({Object.keys(event.query || {}).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('replays')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
            activeTab === 'replays'
              ? 'border-relay-purple text-relay-purple-light bg-relay-purple/10'
              : 'border-transparent text-relay-subtext hover:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>Replay History ({event.replay_history?.length || 0})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'payload' && <JsonViewer payload={event.payload} headers={event.headers} />}

      {activeTab === 'diff' && (
        <JsonDiff
          leftEvent={event}
          rightEvent={targetCompareEvent}
          availableEvents={sampleComparisonEvents}
          onSelectCompareEvent={handleSelectCompareTarget}
        />
      )}

      {activeTab === 'headers' && <HeadersViewer headers={event.headers} event={event} />}

      {activeTab === 'query' && <QueryParams queryParams={event.query} event={event} />}

      {activeTab === 'replays' && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-relay-border/80 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-relay-purple-light" />
            <h3 className="text-sm font-bold text-white">Replay Audit Logs</h3>
          </div>
          <div className="divide-y divide-relay-border/40 font-mono text-xs">
            {event.replay_history?.length === 0 ? (
              <div className="p-8 text-center text-relay-muted font-sans text-xs">
                No local replay executions recorded for this event yet.
              </div>
            ) : (
              event.replay_history?.map((rep) => (
                <div key={rep.id} className="p-4 flex items-center justify-between hover:bg-relay-card-hover/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold border bg-relay-green/10 text-relay-green border-relay-green/20">
                      {rep.status_code || 200} OK
                    </span>
                    <span className="text-slate-200">{rep.target_url}</span>
                  </div>
                  <div className="flex items-center gap-4 text-relay-muted font-sans">
                    <span>{rep.latency_ms || 18}ms</span>
                    <span>{rep.replayed_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        currentEvent={event}
        availableEvents={sampleComparisonEvents}
        targetEvent={targetCompareEvent}
        onSelectTargetEvent={handleSelectCompareTarget}
      />
    </div>
  );
}
