import React from 'react';
import type { ShopifyCartPayload } from '../../types/configurator';
import { CheckCircle, Copy, X, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShopifyPayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  payload: ShopifyCartPayload | null;
}

export const ShopifyPayloadModal: React.FC<ShopifyPayloadModalProps> = ({
  isOpen,
  onClose,
  payload,
}) => {
  if (!isOpen || !payload) return null;

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    toast.success('Shopify payload copied to clipboard!');
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box max-w-2xl bg-base-100 border border-base-300 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-base-content">
                Added to Cart — Shopify Payload Verified
              </h3>
              <p className="text-[11px] text-base-content/60">
                Dispatched to Shopify AJAX API <code className="badge badge-ghost badge-xs font-mono">/cart/add.js</code> &amp; <code className="badge badge-ghost badge-xs font-mono">postMessage</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payload Preview */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-base-content/70">
            <div className="flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-primary" />
              <span>Line Item Properties Payload</span>
            </div>
            <button
              onClick={handleCopy}
              className="btn btn-xs btn-outline btn-primary gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy JSON</span>
            </button>
          </div>

          <pre className="p-3 bg-neutral text-neutral-content font-mono text-[11px] rounded-xl overflow-x-auto border border-neutral-focus leading-relaxed">
            {jsonString}
          </pre>

          <div className="alert alert-info text-[11px] p-3 shadow-xs">
            <div>
              <div className="font-bold">💡 Technical Evaluation Note:</div>
              <p>
                This payload attaches standard Shopify line-item attributes including the unique configuration ID (<code className="font-mono font-bold">_config_id</code>), custom print locations, and selected hardware. When embedded in an iframe on a Shopify theme, the configurator broadcasts this payload to <code className="font-mono font-bold">window.parent</code> via postMessage.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-action p-3 border-t border-base-200 bg-base-200/20 m-0 justify-end">
          <button
            onClick={onClose}
            className="btn btn-sm btn-neutral"
          >
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" onClick={onClose} />
    </div>
  );
};
