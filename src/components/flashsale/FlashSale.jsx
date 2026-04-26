import { useState, useEffect, memo } from "react";
import { useFlashSale } from "../context/FlashSaleContext";

const CountdownTimer = memo(function CountdownTimer({ endTime, onExpired }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        onExpired?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpired]);

  const timeBlocks = [
    { value: timeLeft.days, label: "j" },
    { value: timeLeft.hours, label: "h" },
    { value: timeLeft.minutes, label: "m" },
    { value: timeLeft.seconds, label: "s" },
  ];

  return (
    <div className="flex items-center gap-1">
      {timeBlocks.map((block, index) => (
        <div key={block.label} className="flex items-center">
          <span className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
            {String(block.value).padStart(2, "0")}
          </span>
          {index < timeBlocks.length - 1 && (
            <span className="text-zinc-400 mx-0.5">:</span>
          )}
        </div>
      ))}
    </div>
  );
});

const FlashSaleBanner = memo(function FlashSaleBanner() {
  const { currentFlashSale } = useFlashSale();

  if (!currentFlashSale || !currentFlashSale.banner) return null;

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-sm font-medium">
            <svg className="h-4 w-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-.945 0l-7 7a1 1 0 01-.945.702h-2c.234 2.452.984 4.736 2.016 6.62a1 1 0 001.743.15c.73-.356 1.337-1.034 1.567-1.965a1 1 0 00-.073-1.256l.631-1.82a1 1 0 01.752-.616h1.873a1 1 0 00.816-.631l.493-1.647a1 1 0 00-.072-.707l-.493-1.647a1 1 0 00-.816-.631h-2.063z" clipRule="evenodd" />
            </svg>
            FLASH SALE
          </span>
        </div>
        <span className="text-sm font-medium">{currentFlashSale.description}</span>
        <CountdownTimer endTime={currentFlashSale.endsAt} />
      </div>
    </div>
  );
});

const FlashSaleCard = memo(function FlashSaleCard({ product, flashDiscount }) {
  const discount = flashDiscount || 20;
  const originalPrice = product.price;
  const salePrice = originalPrice - (originalPrice * discount / 100);
  const savings = originalPrice - salePrice;

  return (
    <div className="relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border-2 border-red-200 dark:border-red-900 hover:border-red-400 transition-colors group">
      {discount > 0 && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md animate-pulse">
          -{discount}%
        </div>
      )}
      <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        {product.cover ? (
          <img
            src={product.cover}
            alt={product.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2">
          {product.title}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{product.author}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">
              {salePrice.toLocaleString()} GNF
            </span>
            <span className="block text-xs text-zinc-400 line-through">
              {originalPrice.toLocaleString()} GNF
            </span>
          </div>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Économisez {savings.toLocaleString()} GNF
        </p>
      </div>
    </div>
  );
});

const FlashSaleBadge = memo(function FlashSaleBadge({ discount = 20 }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-.945 0l-7 7a1 1 0 01-.945.702h-2c.234 2.452.984 4.736 2.016 6.62a1 1 0 001.743.15c.73-.356 1.337-1.034 1.567-1.965a1 1 0 00-.073-1.256l.631-1.82a1 1 0 01.752-.616h1.873a1 1 0 00.816-.631l.493-1.647a1 1 0 00-.072-.707l-.493-1.647a1 1 0 00-.816-.631h-2.063z" clipRule="evenodd" />
      </svg>
      -{discount}%
    </span>
  );
});

const FlashSaleSection = memo(function FlashSaleSection({ products, limit = 8 }) {
  const { currentFlashSale } = useFlashSale();

  if (!currentFlashSale || !products?.length) return null;

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
          Flash Sale
        </h3>
        <CountdownTimer endTime={currentFlashSale.endsAt} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, limit).map((product) => (
          <FlashSaleCard
            key={product.id}
            product={product}
            flashDiscount={currentFlashSale.discount}
          />
        ))}
      </div>
    </section>
  );
});

export { CountdownTimer, FlashSaleBanner, FlashSaleCard, FlashSaleBadge, FlashSaleSection };