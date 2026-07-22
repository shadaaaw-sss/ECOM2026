'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export interface HeroSlide {
  id: string;
  type: 'image' | 'video';
  src: string;
  title?: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  linkToProduct?: string | null;
}

export default function HeroSection({ slides: fallbackSlides = [] }: { slides?: HeroSlide[] }) {
  const { t, isRTL } = useLanguage();
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    api.get<any[]>('/homepage-hero').then((data) => {
      if (!active || !Array.isArray(data) || data.length === 0) return;
      setSlides(data.map((h) => ({
        id: h.id,
        type: h.type === 'video' ? 'video' : 'image',
        src: h.url,
        title: h.title || '',
        subtitle: h.subtitle || '',
        cta: (h.cta_label && h.cta_href) ? { label: h.cta_label, href: h.cta_href } : undefined,
        linkToProduct: h.link_product_id || null,
      })));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const goTo = (i: number) => { setCurrent(i); setPaused(false); };
  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    timerRef.current = setInterval(next, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, paused, slides.length]);

  if (!slides.length) return null;

  const slide = slides[Math.min(current, slides.length - 1)];

  return (
    <section className="relative bg-cream overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* ============ IDENTITY PANEL ============ */}
        <div className="relative order-2 lg:order-1 lg:col-span-5 flex items-center justify-center bg-gradient-to-br from-cream via-beige-50 to-beige-100 px-8 py-14 lg:px-14 xl:px-20">
          <div className="max-w-md text-center lg:text-start">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-gold-600 font-sans text-xs font-medium uppercase tracking-[0.35em] mb-5"
            >
              {t('hero_badge')}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.25 }}
              className="font-serif text-5xl md:text-6xl font-light uppercase tracking-[0.2em] text-foreground mb-6"
            >
              Makhmal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="font-sans text-base md:text-lg italic text-muted-foreground leading-relaxed mb-10"
            >
              {t('hero_tagline')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.55 }}
            >
              <Link
                href="/products"
                className="group relative inline-flex items-center justify-center overflow-hidden border border-burgundy-700 px-10 py-3.5 font-sans text-xs font-medium uppercase tracking-[0.25em] text-burgundy-700 transition-colors duration-500 hover:text-cream"
              >
                <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-burgundy-700 transition-transform duration-500 ease-out group-hover:scale-x-100" />
                {t('hero_cta_shop')}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ============ MEDIA CAROUSEL ============ */}
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-1 lg:order-2 lg:col-span-7 h-[45vh] sm:h-[55vh] lg:h-[65vh] lg:min-h-[560px] lg:max-h-[820px] overflow-hidden bg-black select-none"
        >
          {slides.map((s, i) => (
            <div key={s.id} className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === current ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none'}`}>
              {s.type === 'video' ? (
                <video
                  src={s.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  disablePictureInPicture
                  controlsList="nodownload noplaybackrate nofullscreen"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img src={s.src} alt="" className="object-cover w-full h-full" loading={i === 0 ? 'eager' : 'lazy'} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {s.linkToProduct && i === current && (
                <Link
                  href={`/products/${s.linkToProduct}`}
                  className="absolute inset-0 z-[1]"
                  aria-label={s.title || 'View product'}
                />
              )}
            </div>
          ))}

          {/* Slide caption overlay */}
          <div className="relative z-10 h-full flex items-end pointer-events-none">
            <div className="w-full px-6 md:px-10 pb-8 md:pb-10">
              {slides.length > 1 && (
                <div className="flex items-center gap-2 mb-4 pointer-events-auto">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} className={`h-0.5 transition-all duration-500 ${i === current ? 'w-10 bg-white' : 'w-3 bg-white/40 hover:bg-white/60'}`} />
                  ))}
                </div>
              )}
              {slide.title && (
                <h2 className="text-white font-serif text-2xl md:text-3xl font-medium leading-snug mb-2 transition-all duration-700 whitespace-pre-line">
                  {slide.title}
                </h2>
              )}
              {slide.subtitle && (
                <p className="text-white/80 font-sans text-sm max-w-md mb-4 leading-relaxed">
                  {slide.subtitle}
                </p>
              )}
              {slide.cta && (
                <Link href={slide.cta.href} className="pointer-events-auto inline-flex items-center gap-2 bg-white text-foreground px-6 py-2.5 rounded-sm font-sans text-xs font-medium uppercase tracking-widest hover:bg-white/90 transition-all">
                  {slide.cta.label}
                </Link>
              )}
            </div>
          </div>

          {/* Nav arrows */}
          {slides.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/25 transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/25 transition-all">
                <ChevronRight size={20} />
              </button>
              <button onClick={() => setPaused(!paused)} className="absolute top-6 right-6 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/25 transition-all text-xs">
                {paused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
