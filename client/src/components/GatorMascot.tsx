type GatorSize = "xs" | "sm" | "md" | "lg" | "xl";
type GatorVariant = "default" | "framed" | "pulse" | "inline";

const sizeMap: Record<GatorSize, string> = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-36 h-36",
};

export default function GatorMascot({
  size = "md",
  variant = "default",
  className = "",
}: {
  size?: GatorSize;
  variant?: GatorVariant;
  className?: string;
}) {
  const sizeClass = sizeMap[size];

  if (variant === "framed") {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <img
          src="/videogator-logo.png"
          alt="VideoGator"
          className={`${sizeClass} relative z-10 drop-shadow-lg rounded-full`}
        />
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping scale-150 opacity-20" />
        <img
          src="/videogator-logo.png"
          alt="VideoGator"
          className={`${sizeClass} relative z-10 drop-shadow-lg rounded-full`}
        />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <img
        src="/videogator-logo.png"
        alt=""
        className={`${sizeClass} inline-block ${className}`}
      />
    );
  }

  return (
    <img
      src="/videogator-logo.png"
      alt="VideoGator"
      className={`${sizeClass} ${className}`}
    />
  );
}
