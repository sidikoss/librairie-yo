import { memo } from "react";

const StarRating = memo(function StarRating({ rating, size = "md", showValue = false, interactive = false, onChange }) {
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => handleClick(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
        >
          <svg
            className={`${sizes[size]} ${star <= rating ? "text-yellow-400 fill-current" : "text-zinc-300 dark:text-zinc-600"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {showValue && rating && (
        <span className="ml-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
});

const ReviewCard = memo(function ReviewCard({ review, onHelpful, onResponse, showBookTitle = false, bookTitle }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? "s" : ""}`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <article className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
            <span className="text-brand-600 dark:text-brand-400 font-medium text-sm">
              {review.userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white">
                {review.userName}
              </h4>
              {review.verified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Acheté
                </span>
              )}
            </div>
            <time className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(review.createdAt)}
            </time>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </header>

      {showBookTitle && bookTitle && (
        <p className="text-xs text-brand-600 dark:text-brand-400 mb-2">
          Avis sur: {bookTitle}
        </p>
      )}

      {review.title && (
        <h5 className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
          {review.title}
        </h5>
      )}

      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3 leading-relaxed">
        {review.comment}
      </p>

      {review.response && (
        <div className="mt-3 pl-3 border-l-2 border-brand-200 dark:border-brand-800">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
            Réponse du vendeur
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {review.response}
          </p>
        </div>
      )}

      <footer className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => onHelpful?.(review.id)}
          className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Utile ({review.helpful || 0})
        </button>
        <button
          onClick={() => onResponse?.(review.id)}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          Répondre
        </button>
      </footer>
    </article>
  );
});

const ReviewSummary = memo(function ReviewSummary({ rating, distribution, totalReviews }) {
  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="flex flex-col gap-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution?.[star] || 0;
        const percentage = getPercentage(count);
        
        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400 w-3">
              {star}
            </span>
            <svg className="h-3 w-3 text-zinc-300 dark:text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const WriteReviewForm = memo(function WriteReviewForm({ bookId, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Veuillez donner une note");
      return;
    }
    if (!title.trim()) {
      setError("Veuillez ajouter un titre");
      return;
    }
    if (!comment.trim() || comment.length < 10) {
      setError("Veuillez écrire un commentaire d'au moins 10 caractères");
      return;
    }

    onSubmit?.({
      bookId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
    });

    setRating(0);
    setTitle("");
    setComment("");
  };

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <h4 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
        Donner votre avis
      </h4>

      <div className="mb-4">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Votre note *
        </label>
        <div
          className="flex gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <svg
                className={`h-6 w-6 ${star <= displayRating ? "text-yellow-400 fill-current" : "text-zinc-300 dark:text-zinc-600"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="review-title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Titre *
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre avis en quelques mots"
          maxLength={100}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="review-comment" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Commentaire *
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience avec ce livre..."
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <p className="text-xs text-zinc-500 mt-1">
          {comment.length}/1000 caractères
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
        >
          Publier mon avis
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
});

export { StarRating, ReviewCard, ReviewSummary, WriteReviewForm };