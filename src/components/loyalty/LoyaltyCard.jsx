import { memo } from "react";
import { useLoyalty } from "../context/LoyaltyContext";

const tierColors = {
  bronze: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-400 to-amber-600",
  },
  silver: {
    bg: "bg-zinc-100 dark:bg-zinc-700/30",
    text: "text-zinc-600 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
    gradient: "from-zinc-400 to-zinc-600",
  },
  gold: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    gradient: "from-yellow-400 to-yellow-600",
  },
  platinum: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    gradient: "from-purple-400 to-purple-600",
  },
};

const LoyaltyBadge = memo(function LoyaltyBadge({ size = "md", showName = true }) {
  const { currentTier } = useLoyalty();
  const colors = tierColors[currentTier.id] || tierColors.bronze;

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${colors.bg} ${colors.text} ${colors.border}
        border ${sizes[size]}
      `}
    >
      <svg className={`h-3 w-3 ${colors.gradient} bg-clip-text text-transparent`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {showName && <span>{currentTier.name}</span>}
    </span>
  );
});

const LoyaltyProgress = memo(function LoyaltyProgress() {
  const { currentTier, nextTier, pointsToNextTier, progressToNextTier, user } = useLoyalty();

  if (!nextTier) {
    return (
      <div className="text-center py-4">
        <p className="text-lg font-medium text-zinc-900 dark:text-white">
          Félicitations! Vous avez atteint le niveau le plus élevé!
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {user?.points || 0} points accumulés
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Prochain niveau</span>
        <span className="font-medium text-zinc-900 dark:text-white">{nextTier.name}</span>
      </div>
      <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
          style={{ width: `${progressToNextTier}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
        {pointsToNextTier} points restants pour {nextTier.name}
      </p>
    </div>
  );
});

const LoyaltyCard = memo(function LoyaltyCard() {
  const { user, currentTier, nextTier, tiers, getAvailableRewards, deductPoints } = useLoyalty();

  const claimReward = (reward) => {
    const success = deductPoints(reward.cost);
    if (success) {
      return { success: true, message: `Réclamation réussie: ${reward.name}` };
    }
    return { success: false, message: "Points insuffisants" };
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            Programme Fidélité
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user?.points || 0} points disponibles
          </p>
        </div>
        <LoyaltyBadge size="lg" />
      </header>

      <LoyaltyProgress />

      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Vos avantages
        </h4>
        <ul className="space-y-2">
          {currentTier.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Échanger vos points
        </h4>
        <div className="space-y-2">
          {getAvailableRewards.map((reward) => (
            <button
              key={reward.id}
              onClick={() => claimReward(reward)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors text-left"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {reward.name}
              </span>
              <span className="text-sm text-brand-600 dark:text-brand-400">
                {reward.cost} pts
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Statistiques
        </h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {user?.totalOrders || 0}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Commandes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {user?.totalSpent?.toLocaleString() || 0} GNF
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total dépensé</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export { LoyaltyBadge, LoyaltyProgress, LoyaltyCard };