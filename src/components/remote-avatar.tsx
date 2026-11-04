"use client";

import { useEffect, useState, type ReactNode } from "react";

function resolveSrc(src: string) {
  if (src.startsWith("https://cdn.intra.42.fr/")) {
    return `/api/avatar?url=${encodeURIComponent(src)}`;
  }
  return src;
}

export function RemoteAvatar({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveSrc(src)}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return fallback;
}
