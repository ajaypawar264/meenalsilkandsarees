"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProductMediaItem = {
  url: string;
  type: "image" | "video";
};

type Props = {
  productName: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  mediaFiles?: ProductMediaItem[];
};

function normalizeUrl(url?: string) {
  if (!url) return "";

  return url
    .replace(/\\/g, "/")
    .trim();
}

export default function ProductMediaSlider({
  productName,
  imageUrl,
  imageUrls = [],
  videoUrls = [],
  mediaFiles = [],
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const touchStartX = useRef(0);

  const finalMedia = useMemo(() => {
    let media: ProductMediaItem[] = [];

    // -----------------------------------------
    // PRIORITY 1 → mediaFiles
    // -----------------------------------------
    if (mediaFiles && mediaFiles.length > 0) {
      media = mediaFiles
        .map((m: any) => {
          const url = normalizeUrl(m?.url || "");

          if (!url) return null;

          return {
            url,
            type:
              m?.type ||
              (url.toLowerCase().includes(".mp4")
                ? "video"
                : "image"),
          };
        })
        .filter(Boolean) as ProductMediaItem[];
    }

    // -----------------------------------------
    // PRIORITY 2 → imageUrls
    // -----------------------------------------
    if (media.length === 0 && imageUrls.length > 0) {
      media = imageUrls
        .map((url) => {
          const normalized = normalizeUrl(url);

          if (!normalized) return null;

          return {
            url: normalized,
            type: "image" as const,
          };
        })
        .filter(Boolean) as ProductMediaItem[];
    }

    // -----------------------------------------
    // PRIORITY 3 → single image
    // -----------------------------------------
    if (media.length === 0 && imageUrl) {
      const normalized = normalizeUrl(imageUrl);

      if (normalized) {
        media = [
          {
            url: normalized,
            type: "image",
          },
        ];
      }
    }

    // -----------------------------------------
    // Remove duplicate URLs
    // -----------------------------------------
    const unique = media.filter(
      (item, index, self) =>
        index === self.findIndex(
          (m) => m.url === item.url
        )
    );

    return unique;
  }, [mediaFiles, imageUrls, imageUrl]);

  // -----------------------------------------
  // Reset slider when product/media changes
  // -----------------------------------------
  useEffect(() => {
    setCurrentIndex(0);
  }, [finalMedia.length]);

  // -----------------------------------------
  // Auto slide
  // -----------------------------------------
  useEffect(() => {
    if (finalMedia.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;

        return next >= finalMedia.length ? 0 : next;
      });
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [finalMedia.length]);

  // -----------------------------------------
  // Previous
  // -----------------------------------------
  const goPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0
        ? finalMedia.length - 1
        : prev - 1
    );
  };

  // -----------------------------------------
  // Next
  // -----------------------------------------
  const goNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;

      return next >= finalMedia.length ? 0 : next;
    });
  };

  // -----------------------------------------
  // Swipe
  // -----------------------------------------
  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    touchStartX.current =
      e.changedTouches[0]?.screenX || 0;
  };

  const handleTouchEnd = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    const touchEndX =
      e.changedTouches[0]?.screenX || 0;

    const difference =
      touchStartX.current - touchEndX;

    if (difference > 50) {
      goNext();
    }

    if (difference < -50) {
      goPrev();
    }
  };

  // -----------------------------------------
  // No media
  // -----------------------------------------
  if (finalMedia.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-400">
        No Media
      </div>
    );
  }

  const activeItem =
    finalMedia[currentIndex] || finalMedia[0];

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ---------------------------------- */}
      {/* MEDIA */}
      {/* ---------------------------------- */}

      {activeItem.type === "video" ? (
        <video
          src={activeItem.url}
          autoPlay
          muted
          loop
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={activeItem.url}
          alt={productName}
          loading="lazy"
          decoding="async"
          fetchPriority={
            currentIndex === 0 ? "high" : "auto"
          }
          className="h-full w-full object-cover"
          onError={(e) => {
            const target =
              e.currentTarget;

            target.style.display = "none";
          }}
        />
      )}

      {/* ---------------------------------- */}
      {/* ARROWS */}
      {/* ---------------------------------- */}

      {finalMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-xl text-white transition hover:bg-black/70"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 px-3 py-1 text-xl text-white transition hover:bg-black/70"
          >
            ›
          </button>
        </>
      )}

      {/* ---------------------------------- */}
      {/* DOTS */}
      {/* ---------------------------------- */}

      {finalMedia.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {finalMedia.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to media ${i + 1}`}
              className={`h-2 w-2 rounded-full transition ${
                currentIndex === i
                  ? "bg-white"
                  : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}