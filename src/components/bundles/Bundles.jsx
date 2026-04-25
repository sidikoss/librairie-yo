import { useState, useMemo, memo } from "react";
import { useBundles } from "../context/BundlesContext";
import { useCart } from "../context/CartContext";

const BundleCard = memo(function BundleCard({ bundle, products = [], onSelect }) {
  const totalBooks = bundle.books?.length || 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-zinc-900 dark:text-white group-hover:text-brand-600 transition-colors">
            {bundle.name}
          </h4>
          {bundle.discount > 0 && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              -{bundle.discount}%
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          {bundle.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          <span className="inline-flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {totalBooks} livres
          </span>
          {bundle.bonus && (
            <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {bundle.bonus}
            </span>
          )}
        </div>
        <button
          onClick={() => onSelect?.(bundle, products)}
          className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Commander ce pack
        </button>
      </div>
    </div>
  );
});

const BundleGrid = memo(function BundleGrid({ category, limit = 6 }) {
  const { bundles, getBundlesByCategory } = useBundles();
  const categoryBundles = category
    ? getBundlesByCategory(category)
    : bundles;

  if (categoryBundles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categoryBundles.slice(0, limit).map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
});

const BundleBuilder = memo(function BundleBuilder({ products, onComplete }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const { calculateBundlePrice } = useBundles();

  const toggleProduct = (productId) => {
    setSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const bundleData = useMemo(() => {
    if (selectedProducts.length < 2) return null;
    const discount = selectedProducts.length >= 3 ? 15 : 10;
    return calculateBundlePrice(
      { discount, bonus: null },
      selectedProducts
    );
  }, [selectedProducts, calculateBundlePrice]);

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-zinc-900 dark:text-white">
        Sélectionnez 2+ livres pour un pack
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);
          return (
            <button
              key={product.id}
              onClick={() => toggleProduct(product.id)}
              className={`
                relative p-3 rounded-lg border text-left transition-all
                ${isSelected
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-brand-300"
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 bg-brand-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2">
                {product.title}
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {product.price.toLocaleString()} GNF
              </p>
            </button>
          );
        })}
      </div>

      {bundleData && selectedProducts.length >= 2 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-zinc-900 dark:text-white">
              Pack {selectedProducts.length} livres
            </span>
            <span className="text-green-600 dark:text-green-400 font-bold">
              -{calculateBundlePrice.discount}%
            </span>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p>Prix original: {bundleData.originalTotal.toLocaleString()} GNF</p>
            <p className="font-bold text-green-600">
              Prix package: {bundleData.finalPrice.toLocaleString()} GNF
            </p>
            <p className="text-green-600">
              Économisez: {bundleData.savings.toLocaleString()} GNF
            </p>
          </div>
          <button
            onClick={() => onComplete?.(selectedProducts, bundleData)}
            className="w-full mt-3 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
          >
            Ajouter au panier
          </button>
        </div>
      )}

      {selectedProducts.length < 2 && selectedProducts.length > 0 && (
        <p className="text-sm text-zinc-500 text-center">
          Sélectionnez au moins 2 livres pour créer un pack
        </p>
      )}
    </div>
  );
});

const QuantityDiscount = memo(function QuantityDiscount({ product, thresholds = [2, 3, 5] }) {
  const discountTiers = [
    { qty: 2, discount: 5 },
    { qty: 3, discount: 10 },
    { qty: 5, discount: 15 },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Achetez en lot:
      </p>
      {discountTiers.map((tier) => (
        <div
          key={tier.qty}
          className="flex items-center justify-between text-sm p-2 bg-zinc-50 dark:bg-zinc-800 rounded"
        >
          <span className="text-zinc-600 dark:text-zinc-400">
            {tier.qty}+ exemplaire{tier.qty > 1 ? "s" : ""}
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            -{tier.discount}%
          </span>
        </div>
      ))}
    </div>
  );
});

export { BundleCard, BundleGrid, BundleBuilder, QuantityDiscount };