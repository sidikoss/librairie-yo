import { memo } from "react";
import { useAnalytics } from "../context/AnalyticsContext";

const StatCard = memo(function StatCard({ label, value, icon, color = "brand", trend }) {
  const colors = {
    brand: "bg-brand-50 dark:bg-brand-900/20 text-brand-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
        {icon && (
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
          {trend > 0 ? "+" : ""}{trend}%
        </p>
      )}
    </div>
  );
});

const DashboardStats = memo(function DashboardStats() {
  const { stats } = useAnalytics();

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Sessions"
        value={stats.sessions}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        color="brand"
      />
      <StatCard
        label="Pages vues"
        value={stats.pageViews}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        }
        color="purple"
      />
      <StatCard
        label="Paniers"
        value={stats.addToCart}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        color="green"
      />
      <StatCard
        label="Revenus"
        value={`${formatNumber(stats.revenue)} GNF`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v8m-2-1H8m8 0h1M6 9H4m0 6h6m4-6h2" />
          </svg>
        }
        color="yellow"
      />
    </div>
  );
});

const TopProducts = memo(function TopProducts() {
  const { stats } = useAnalytics();

  if (!stats.topProducts?.length) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
      <h3 className="font-medium text-zinc-900 dark:text-white mb-4">
        Produits les plus vus
      </h3>
      <ul className="space-y-3">
        {stats.topProducts.slice(0, 5).map(([productId, count], index) => (
          <li key={productId} className="flex items-center gap-3">
            <span className="text-lg font-bold text-zinc-300 dark:text-zinc-600">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {productId}
              </p>
              <p className="text-xs text-zinc-500">{count} vues</p>
            </div>
            <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${(count / stats.topProducts[0][1]) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

const TopCategories = memo(function TopCategories() {
  const { stats } = useAnalytics();

  if (!stats.topCategories?.length) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
      <h3 className="font-medium text-zinc-900 dark:text-white mb-4">
        Catégories populaires
      </h3>
      <ul className="space-y-2">
        {stats.topCategories.slice(0, 5).map(([category, count], index) => (
          <li key={category} className="flex items-center justify-between">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{category}</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-white">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

const ConversionFunnel = memo(function ConversionFunnel() {
  const { stats } = useAnalytics();

  const stages = [
    { label: "Vues produits", value: stats.productViews },
    { label: "Ajouts panier", value: stats.addToCart },
    { label: "Achats", value: stats.checkouts },
  ];

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
      <h3 className="font-medium text-zinc-900 dark:text-white mb-4">
        Entonnoir de conversion
      </h3>
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">{stage.label}</span>
              <span className="font-medium text-zinc-900 dark:text-white">{stage.value}</span>
            </div>
            <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-lg transition-all"
                style={{ width: `${(stage.value / maxValue) * 100}%` }}
              />
            </div>
            {index < stages.length - 1 && stage.value > 0 && (
              <p className="text-xs text-green-600 mt-1">
                {((stage.value / maxValue) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const AnalyticsDashboard = memo(function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProducts />
        <TopCategories />
      </div>
      <ConversionFunnel />
    </div>
  );
});

export { AnalyticsDashboard, DashboardStats, TopProducts, TopCategories, ConversionFunnel };