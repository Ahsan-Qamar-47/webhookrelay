import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link 
        to="/events" 
        className="inline-flex items-center gap-2 text-sm text-relay-subtext hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-relay-purple-light" />
            Event Detail: <span className="font-mono text-relay-purple-light">{id}</span>
          </h1>
          <p className="text-relay-subtext text-sm mt-1">
            Inspection details for event payload #{id}.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 text-center text-relay-muted">
        <h3 className="text-lg font-semibold text-slate-300">Payload Inspector</h3>
        <p className="text-sm text-relay-subtext max-w-md mx-auto mt-1">
          Full JSON payload and header inspection breakdown for event {id}.
        </p>
      </div>
    </div>
  );
}
