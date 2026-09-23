import { 
  Zap, 
  GitCommit, 
  MessageSquare, 
  Hash, 
  ShoppingBag, 
  PhoneCall, 
  Globe 
} from 'lucide-react';

/**
 * SourceBadge Component
 * Renders color-coded badge with provider icon for Stripe, GitHub, WhatsApp, Slack, Shopify, Twilio, or Generic.
 */
export default function SourceBadge({ source = 'generic', showLabel = true, size = 'sm', className = '' }) {
  const normalized = (source || 'generic').toLowerCase();

  const getConfig = (type) => {
    if (type.includes('stripe')) {
      return {
        label: 'Stripe',
        icon: Zap,
        styles: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      };
    }
    if (type.includes('github')) {
      return {
        label: 'GitHub',
        icon: GitCommit,
        styles: 'bg-slate-700/50 text-slate-200 border-slate-600/60',
      };
    }
    if (type.includes('whatsapp') || type.includes('meta')) {
      return {
        label: 'WhatsApp',
        icon: MessageSquare,
        styles: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    }
    if (type.includes('slack')) {
      return {
        label: 'Slack',
        icon: Hash,
        styles: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
      };
    }
    if (type.includes('shopify')) {
      return {
        label: 'Shopify',
        icon: ShoppingBag,
        styles: 'bg-lime-500/15 text-lime-400 border-lime-500/30',
      };
    }
    if (type.includes('twilio')) {
      return {
        label: 'Twilio',
        icon: PhoneCall,
        styles: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    }
    return {
      label: source && source !== 'generic' && source !== 'unknown' ? source : 'Generic',
      icon: Globe,
      styles: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    };
  };

  const config = getConfig(normalized);
  const IconComponent = config.icon;
  const iconSizeClass = size === 'xs' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const textSizeClass = size === 'xs' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono font-semibold border ${config.styles} ${textSizeClass} ${className}`}
      title={`Webhook Source: ${config.label}`}
    >
      <IconComponent className={iconSizeClass} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
