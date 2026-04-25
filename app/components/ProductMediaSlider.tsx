"use client";

import { useEffect, useMemo, useState, useRef } from "react";

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
  return url.replace(/\\/g, "/").trim();
}

export default function ProductMediaSlider({
  productName,
  imageUrl,
  imageUrls = [],
  videoUrls = [],
  mediaFiles = [],
}: Props) {
const finalMedia = useMemo(() => {
  // ✅ PRIORITY 1 → mediaFiles
  if (mediaFiles && mediaFiles.length > 0) {
    return mediaFiles.map((m: any) => ({
      url: normalizeUrl(m.url || ""),
      type: m.type || (m.url?.includes(".mp4") ? "video" : "image"),
    }));
  }

  // ✅ PRIORITY 2 → imageUrls
  if (imageUrls && imageUrls.length > 0) {
    return imageUrls.map((url) => ({
      url: normalizeUrl(url),
      type: "image" as const,
    }));
  }

  // ✅ PRIORITY 3 → single image
  if (imageUrl) {
    return [{ url: normalizeUrl(imageUrl), type: "image" as const }];
  }

  return [];
}, [mediaFiles, imageUrls, imageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [finalMedia.length]);

  // ✅ Auto slide
  useEffect(() => {
    if (finalMedia.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % finalMedia.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [finalMedia]);

  const goPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? finalMedia.length - 1 : prev - 1
    );
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % finalMedia.length);
  };

  // ✅ Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;

    if (touchStartX.current - touchEndX.current > 50) goNext();
    if (touchEndX.current - touchStartX.current > 50) goPrev();
  };

  if (finalMedia.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        No Media
      </div>
    );
  }

  const activeItem = finalMedia[currentIndex];

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ✅ MEDIA */}
      {activeItem.type === "video" ? (
        <video
          src={activeItem.url}
          autoPlay
          muted
          loop
          controls
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={activeItem.url}
          alt={productName}
          className="h-full w-full object-cover"
        />
      )}

      {/* ✅ ARROWS */}
      {finalMedia.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded-full"
          >
            ‹
          </button>

          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded-full"
          >
            ›
          </button>
        </>
      )}

      {/* ✅ DOTS */}
      {finalMedia.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {finalMedia.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                currentIndex === i ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}