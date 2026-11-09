import React from 'react';
import { Compass, Home, ArrowLeft, ShoppingBag } from 'lucide-react';

export type NotFoundUIProps = {
  title?: string;
  description?: string;
  onGoHome?: () => void;
  onGoBack?: () => void;
  onGoShopifyPreview?: () => void;
};

export const NotFoundUI: React.FC<NotFoundUIProps> = ({
  title = '404 — SECTION NOT FOUND',
  description = 'The canopy model, preset section, or page route you are trying to view does not exist or has been relocated.',
  onGoHome,
  onGoBack,
  onGoShopifyPreview,
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-base-100 text-base-content transition-colors select-none">
      <div className="card w-full max-w-md bg-base-200/70 border border-base-content/10 shadow-2xl backdrop-blur-lg p-6 sm:p-8 text-center animate-fade-in">
        {/* radar compass icon with pulse effect */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-3xl bg-primary/10 opacity-75" />
          <Compass className="relative h-10 w-10 animate-pulse text-primary" />
        </div>

        {/* status badge */}
        <div className="flex justify-center mb-3">
          <span className="badge badge-error badge-outline gap-1.5 font-mono text-xs tracking-wider uppercase font-semibold">
            Error 404
          </span>
        </div>

        {/* heading */}
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-base-content mb-2 uppercase">
          {title}
        </h1>

        {/* description */}
        <p className="text-sm text-base-content/70 leading-relaxed mb-6">
          {description}
        </p>

        {/* quick action buttons */}
        <div className="flex flex-col gap-2.5">
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="btn btn-primary w-full gap-2 font-semibold shadow-md"
            >
              <Home className="w-4 h-4" />
              <span>Return to 3D Studio</span>
            </button>
          )}

          {onGoShopifyPreview && (
            <button
              type="button"
              onClick={onGoShopifyPreview}
              className="btn btn-outline w-full gap-2 font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Open Shopify PDP Preview</span>
            </button>
          )}

          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="btn btn-ghost btn-sm w-full gap-1.5 text-base-content/60 hover:text-base-content"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFoundUI;
