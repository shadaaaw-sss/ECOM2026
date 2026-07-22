'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface GalleryMedia {
  id?: string;
  url: string;
  altText?: string | null;
  type: 'image' | 'video';
  isMain?: boolean;
}

export default function ProductGallery({ media, productName }: { media: GalleryMedia[]; productName: string }) {
  // The main media item is always shown first, regardless of incoming order.
  const items = useMemo(
    () => [...media].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0)),
    [media]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: items.length > 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // Only the active slide's video plays, so switching slides never leaves audio/CPU running in the background.
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === selectedIndex) video.play().catch(() => {});
      else video.pause();
    });
  }, [selectedIndex, items]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Main carousel */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-beige-50 group">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {items.map((item, i) => (
              <div key={item.id || item.url} className="relative flex-[0_0_100%] h-full">
                {item.type === 'video' ? (
                  <video
                    ref={(el) => { videoRefs.current[i] = el; }}
                    src={item.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.altText || productName}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {items.length > 1 && (
          <>
            <button onClick={scrollPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={scrollNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm">
              <ChevronRight size={18} />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {items.map((_, i) => (
                <button key={i} onClick={() => scrollTo(i)} className={`h-1.5 rounded-full transition-all ${i === selectedIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={item.id || item.url}
              onClick={() => scrollTo(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedIndex ? 'border-burgundy-700 ring-1 ring-burgundy-700' : 'border-transparent hover:border-beige-200'}`}
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full bg-gray-100">
                  <video src={item.url} muted className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play size={14} className="text-white" fill="white" />
                  </div>
                </div>
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
