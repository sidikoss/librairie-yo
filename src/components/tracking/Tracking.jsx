import { memo } from "react";
import { useTracking } from "../context/TrackingContext";

const icons = {
  check: {
    path: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
    outline: "M5.993 12l-.001 6.997L3 21M9 12l-.001 6.997L7 21m2.001-9.997L7 6m2-4.003L3 2m4-4l2.997-2.997",
  },
  clock: {
    path: "M12 6v6l4 2m4-10a8 8 0 11-16 0 8 8 0 0116 0z",
    outline: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  },
  package: {
    path: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    outline: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  truck: {
    path: "M8 6h13M5 6h1M5 18h1M13 18h1M5 6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6zM5 10h14M5 14h14",
    outline: "M8 6h13M5 6h1M5 18h1M13 18h1M5 6a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6zM5 10h14M5 14h14",
  },
  home: {
    path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    outline: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
};

const statusColors = {
  completed: "text-green-500",
  active: "text-brand-500",
  pending: "text-zinc-300 dark:text-zinc-600",
  cancelled: "text-red-500",
};

const StepIcon = memo(function StepIcon({ icon, status }) {
  const path = icons[icon]?.path;
  if (!path) return null;

  return (
    <svg className={`h-6 w-6 ${statusColors[status]}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
  );
});

const TrackingTimeline = memo(function TrackingTimeline({ orderId, compact = false }) {
  const { getTracking, getProgress } = useTracking();
  const tracking = getTracking(orderId);
  const progress = getProgress(orderId);

  if (!tracking) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>Suivi non disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          Progression
        </span>
        <span className="font-medium text-zinc-900 dark:text-white">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={compact ? "space-y-2" : "space-y-6 mt-6"}>
        {tracking.steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <StepIcon icon={step.icon} status={step.status} />
              {index < tracking.steps.length - 1 && (
                <div
                  className={`w-0.5 h-8 ${
                    step.status === "completed"
                      ? "bg-green-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium ${
                  step.status === "active"
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500"
                }`}
              >
                {step.label}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {step.description}
              </p>
              {step.estimated && step.status === "pending" && (
                <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                  Temps estimé: {step.estimated}
                </p>
              )}
              {step.completedAt && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  {new Date(step.completedAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const TrackingStatus = memo(function TrackingStatus({ orderId }) {
  const { getCurrentStep } = useTracking();
  const currentStep = getCurrentStep(orderId);

  if (!currentStep) return null;

  const statusConfig = {
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    active: "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400",
    pending: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[currentStep.status]}`}>
      <StepIcon icon={currentStep.icon} status={currentStep.status} />
      <span className="text-sm font-medium">{currentStep.label}</span>
    </div>
  );
});

const TrackingCard = memo(function TrackingCard({ orderId, onTrackMore }) {
  const { getTracking, getProgress } = useTracking();
  const tracking = getTracking(orderId);

  if (!tracking) return null;

  const currentStep = tracking.steps[tracking.currentStep];
  const progress = getProgress(orderId);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Commande</p>
          <p className="font-medium text-zinc-900 dark:text-white">#{orderId}</p>
        </div>
        <TrackingStatus orderId={orderId} />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-600 dark:text-zinc-400">Statut</span>
          <span className="font-medium text-zinc-900 dark:text-white">
            {currentStep?.label}
          </span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {onTrackMore && (
        <button
          onClick={() => onTrackMore(orderId)}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Voir le suivi complet
        </button>
      )}
    </div>
  );
});

const TrackingHistory = memo(function TrackingHistory() {
  const { getAllTracking } = useTracking();
  const trackingList = getAllTracking();

  if (trackingList.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <svg className="h-12 w-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 001-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
        <p>Aucune commande en cours</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trackingList.map((tracking) => (
        <TrackingCard key={tracking.orderId} orderId={tracking.orderId} />
      ))}
    </div>
  );
});

export { TrackingTimeline, TrackingStatus, TrackingCard, TrackingHistory };