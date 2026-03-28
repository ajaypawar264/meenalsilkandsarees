"use client";

import { useEffect, useMemo, useState } from "react";

type ProductMediaItem = {
  url: string;
  type: "image" | "video";
  fileType?: string;
  thumbnailUrl?: string;
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
    .replace(/^public\//, "/")
    .replace(/^public/, "/")
    .trim();
}

export default function ProductMediaSlider({
  productName,
  imageUrl,
  imageUrls = [],
  videoUrls = [],
  mediaFiles = [],
}: Props) {
  const finalMedia = useMemo(() => {
    const normalizedMediaFiles = mediaFiles
      .map((item) => ({
        ...item,
        url: normalizeUrl(item.url),
      }))
      .filter((item) => item.url);

    if (normalizedMediaFiles.length > 0) return normalizedMediaFiles;

    const images = imageUrls
      .map((url) => normalizeUrl(url))
      .filter(Boolean)
      .map((url) => ({
        url,
        type: "image" as const,
      }));

    const videos = videoUrls
      .map((url) => normalizeUrl(url))
      .filter(Boolean)
      .map((url) => ({
        url,
        type: "video" as const,
      }));

    const singleImage = normalizeUrl(imageUrl);

    if (images.length === 0 && videos.length === 0 && singleImage) {
      return [{ url: singleImage, type: "image" as const }];
    }

    return [...images, ...videos];
  }, [mediaFiles, imageUrls, videoUrls, imageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);

  useEffect(() => {
    setCurrentIndex(0);
    setFailedUrls([]);
  }, [finalMedia.length]);

  const visibleMedia = useMemo(() => {
    return finalMedia.filter((item) => !failedUrls.includes(item.url));
  }, [finalMedia, failedUrls]);

  useEffect(() => {
    if (currentIndex > visibleMedia.length - 1) {
      setCurrentIndex(0);
    }
  }, [currentIndex, visibleMedia.length]);

  if (visibleMedia.length === 0) {
    return (
      <div className="flex h-[320px] w-full items-center justify-center bg-black/20 text-white/50">
        No Media
      </div>
    );
  }

  const activeItem = visibleMedia[currentIndex];

  const goPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? visibleMedia.length - 1 : prev - 1
    );
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleMedia.length);
  };

  return (
    <div className="relative h-[620px] w-full overflow-hidden bg-black/20">
      {activeItem.type === "video" ? (
        <video
          src={activeItem.url}
          controls
          className="h-full w-full object-contain"
        />
      ) : (
        <img
          src={activeItem.url}
          alt={productName}
          className="h-full w-full object-contain"
          onError={() => {
            setFailedUrls((prev) =>
              prev.includes(activeItem.url) ? prev : [...prev, activeItem.url]
            );
          }}
        />
      )}

      {visibleMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2">
            {visibleMedia.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 w-2.5 rounded-full ${
                  currentIndex === index ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}