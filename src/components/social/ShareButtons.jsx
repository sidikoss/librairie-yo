import { memo } from "react";
import { APP_NAME, APP_URL } from "../config/constants";

const ShareButton = memo(function ShareButton({ network, url, title, description, onShare }) {
  const networks = {
    whatsapp: {
      name: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m-8.446-5.573a1.166 1.166 0 00-1.45.154l-.57.67c-.35.42-.82.94-1.04 1.15-.37.36-.08.81.26-.21.33-.34.74-.83 1.18-1.36.27-.31.54-.77.31-1.2-.22-.41-.79-.59-1.11-.74-.31-.15-.59-.26-.85-.36l-.57-.04c-.19 0-.5.02-.77.14-.27.11-.58.27-.84.48-.26.21-.54.37-.82.23-.56-.28-.84-1.03-.84-1.58 0-1.17 1.04-2.2 2.37-2.2 1.21 0 2.17.82 2.38 1.93.2 1.11.2 2.17.1 2.48z",
    },
    facebook: {
      name: "Facebook",
      color: "bg-blue-600 hover:bg-blue-700",
      icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.637H7.9v-3.497h2.055V8.797c0-2.04 1.238-3.236 3.078-3.236.884 0 1.797.159 1.797.159v1.981h-1.015c-1.002 0-1.318.621-1.318 1.258v1.44h2.144l-.35 3.497h-1.794v8.637c5.736-.9 10.124-5.864 10.124-11.854z",
    },
    twitter: {
      name: "Twitter",
      color: "bg-sky-500 hover:bg-sky-600",
      icon: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.892a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
    },
    telegram: {
      name: "Telegram",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.615 5.237l-1.767 8.135-1.687-6.032-6.032 1.714 14.486-3.817zm-11.23 1.67l7.435-2.136 5.002 4.522-13.437 6.386V8.907z",
    },
    email: {
      name: "Email",
      color: "bg-zinc-600 hover:bg-zinc-700",
      icon: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
    },
    copy: {
      name: "Copier",
      color: "bg-zinc-500 hover:bg-zinc-600",
      icon: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
    },
  };

  const config = networks[network];
  if (!config) return null;

  const handleShare = async () => {
    let shareUrl;

    switch (network) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${description}\n\n${url}`)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
        break;
      case "copy":
        await navigator.clipboard.writeText(`${title}\n\n${description}\n\n${url}`);
        onShare?.();
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${config.color}`}
    >
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d={config.icon} />
      </svg>
      {config.name}
    </button>
  );
});

const ShareButtons = memo(function ShareButtons({ url, title, description, networks = ["whatsapp", "facebook", "twitter", "telegram"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {networks.map((network) => (
        <ShareButton
          key={network}
          network={network}
          url={url}
          title={title}
          description={description}
        />
      ))}
    </div>
  );
});

const ShareCard = memo(function ShareCard({ product, compact = false }) {
  const url = `${APP_URL}/catalogue?id=${product.id}`;
  const title = `${product.title} - ${product.author}`;
  const description = `Découvrez "${product.title}" de ${product.author} sur Librairie YO. Prix: ${product.price.toLocaleString()} GNF`;

  if (compact) {
    return (
      <div className="flex gap-2">
        <ShareButton network="whatsapp" url={url} title={title} description={description} />
        <ShareButton network="copy" url={url} title={title} description={description} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
      <h3 className="font-medium text-zinc-900 dark:text-white mb-3">Partager ce livre</h3>
      <ShareButtons url={url} title={title} description={description} />
    </div>
  );
});

const ShareModal = memo(function ShareModal({ isOpen, onClose, product }) {
  if (!isOpen) return null;

  const url = `${APP_URL}/catalogue?id=${product?.id}`;
  const title = product ? `${product.title} - ${product.author}` : APP_NAME;
  const description = product
    ? `Découvrez "${product.title}" sur Librairie YO - ${product.price.toLocaleString()} GNF`
    : `Votre librairie numérique en République de Guinea`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">Partager</h3>
        <ShareButtons url={url} title={title} description={description} />
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300"
        >
          Fermer
        </button>
      </div>
    </div>
  );
});

export { ShareButton, ShareButtons, ShareCard, ShareModal };