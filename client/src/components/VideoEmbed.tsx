import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

type Platform = "tiktok" | "youtube" | "instagram";

export default function VideoEmbed({
  embedUrl,
  platform,
  title,
  className = "",
}: {
  embedUrl: string;
  platform: Platform;
  title?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const aspectClass =
    platform === "tiktok" || platform === "instagram"
      ? "aspect-[9/16] max-w-[325px]"
      : "aspect-video w-full";

  if (hasError) {
    return (
      <div
        ref={ref}
        className={`${aspectClass} rounded-lg border border-gold-dim/20 bg-card flex flex-col items-center justify-center gap-3 p-4 ${className}`}
      >
        <p className="text-sm text-muted-foreground text-center">
          {title || "Video embed"}
        </p>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
        >
          Watch on {platform} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div ref={ref} className={`${aspectClass} ${className}`}>
      {isVisible ? (
        <iframe
          src={embedUrl}
          title={title || "Video embed"}
          className="w-full h-full rounded-lg border border-gold-dim/20"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full rounded-lg border border-gold-dim/20 bg-card animate-pulse" />
      )}
    </div>
  );
}
