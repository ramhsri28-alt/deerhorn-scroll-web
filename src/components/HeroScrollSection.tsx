import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { formatPrice, FALLBACK_HERO_IMG } from '../data';

interface HeroScrollSectionProps {
  onAddToCart: (item: CartItem) => void;
  currency: string;
}

const TOTAL_FRAMES = 300;

export function HeroScrollSection({ onAddToCart, currency }: HeroScrollSectionProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const fallbackImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Setup fallback image in case ezgif frames are not present in root/public
    const fbImg = new Image();
    fbImg.src = FALLBACK_HERO_IMG;
    fbImg.onload = () => {
      fallbackImgRef.current = fbImg;
      if (!imagesRef.current[1]?.complete) {
        renderFrame(1);
      }
    };

    const images: HTMLImageElement[] = [];

    // Frame 1
    const firstImg = new Image();
    firstImg.src = 'ezgif-frame-001.jpg';
    firstImg.onload = () => {
      renderFrame(1);
    };
    images[1] = firstImg;

    // Frames 2 to 300
    for (let i = 2; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `ezgif-frame-${frameNum}.jpg`;
      images[i] = img;
    }

    imagesRef.current = images;
  }, []);

  const renderFrame = (frameNum: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let img = imagesRef.current[frameNum];
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let k = frameNum - 1; k >= 1; k--) {
        if (imagesRef.current[k] && imagesRef.current[k].complete && imagesRef.current[k].naturalWidth > 0) {
          img = imagesRef.current[k];
          break;
        }
      }
    }

    const cw = canvas.width;
    const ch = canvas.height;

    // If frames aren't loaded, use fallback with smooth rotation perspective
    if (!img || !img.complete || img.naturalWidth === 0) {
      if (fallbackImgRef.current && fallbackImgRef.current.complete) {
        ctx.clearRect(0, 0, cw, ch);
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        const rotationAngle = (frameNum / TOTAL_FRAMES) * Math.PI * 0.1 - (Math.PI * 0.05);
        ctx.rotate(rotationAngle);
        const fb = fallbackImgRef.current;
        const scale = Math.min(cw / fb.naturalWidth, ch / fb.naturalHeight) * 0.85;
        const dw = fb.naturalWidth * scale;
        const dh = fb.naturalHeight * scale;
        ctx.drawImage(fb, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
      return;
    }

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  const updateCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    renderFrame(currentFrame);
  };

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [currentFrame]);

  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScrolled = -rect.top;
      const rawProgress = currentScrolled / totalScrollable;
      const progress = Math.max(0, Math.min(1, rawProgress));

      setScrollProgress(progress);

      const targetFrame = Math.min(
        TOTAL_FRAMES,
        Math.max(1, Math.floor(progress * (TOTAL_FRAMES - 1)) + 1)
      );

      setCurrentFrame(targetFrame);
      renderFrame(targetFrame);
    };

    const onScrollThrottled = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScrollThrottled, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScrollThrottled);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const rotationDegrees = Math.round(scrollProgress * 360);

  const handleAcquire = () => {
    onAddToCart({
      id: 'flagship-apex',
      name: 'The Titan-Edge Apex MK-IV',
      price: 899.00,
      image: FALLBACK_HERO_IMG,
      category: 'Flagship Architecture',
      quantity: 1
    });
    navigate('/cart');
  };

  const scrollToSpecs = () => {
    const el = document.getElementById('specs-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="relative w-full h-[220vh]">
      {/* Sticky Viewport Stage */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-margin pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
            
            {/* LEFT COLUMN: HERO CONTENT */}
            <div className="lg:col-span-6 flex flex-col gap-space-md z-10">
              <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-lg bg-surface-container-high/70 border border-outline-variant/30 backdrop-blur-md w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-medium">Telemetry Release 4.0</span>
              </div>

              <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface leading-none">
                Architectural <br/>
                <span className="italic text-primary font-normal">Precision</span> <br/>
                Hardware
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg leading-relaxed font-light">
                Grounded acoustic architecture forged with aerospace titanium, tactile brushed bronze, and quiet acoustic resonance. Calibrated for understated tactile performance.
              </p>

              <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                <button
                  onClick={handleAcquire}
                  className="group relative px-space-xl py-3.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold hover:bg-primary-fixed-dim active:scale-95 transition-all flex items-center gap-space-sm shadow-sm cursor-pointer"
                  type="button"
                >
                  <span>Acquire System — {formatPrice(899.00, currency)}</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </button>
                <button
                  onClick={scrollToSpecs}
                  className="px-space-lg py-3.5 rounded-lg bg-surface-container-high/80 border border-outline-variant/40 text-on-surface hover:text-primary hover:border-primary/50 font-label-md text-label-md uppercase tracking-wider font-semibold transition-all flex items-center gap-space-xs cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                  <span>Explore Architecture</span>
                </button>
              </div>

              <div className="pt-space-md flex items-center gap-space-lg text-on-surface-variant">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">Mil-Spec Certified</span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px]">shield</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">3-Year GroundCare</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 300-FRAME ROTATION CANVAS */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/15 via-transparent to-secondary/15 rounded-full blur-3xl transform scale-90 pointer-events-none"></div>

              <div className="relative w-full aspect-square max-w-lg rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/40 shadow-[0_25px_60px_rgba(0,0,0,0.7)] group flex items-center justify-center">
                
                {/* Live 300-frame Canvas */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-surface-container-lowest/20 pointer-events-none"></div>

                {/* Top status: rotation & frame */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 text-primary text-label-sm text-[11px] uppercase tracking-wider font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span>ROTATION: {rotationDegrees}°</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 text-on-surface-variant text-label-sm text-[11px] uppercase tracking-wider font-mono">
                    <span>FRAME {String(currentFrame).padStart(3, '0')} / {TOTAL_FRAMES}</span>
                  </div>
                </div>

                {/* Bottom Chassis Badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-surface-container-low/95 backdrop-blur-md rounded-xl border border-outline-variant/40 p-space-md shadow-xl flex items-center justify-between z-10">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary block font-semibold">CHASSIS 01 • GRADE V</span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-normal">Titan-Edge Apex MK-IV</span>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant block">SYNAPSE BUS</span>
                    <span className="font-label-md text-label-md text-secondary font-semibold font-mono">1024 GB/s</span>
                  </div>
                </div>

                {/* Hint overlay on initial rest */}
                {scrollProgress < 0.05 && (
                  <div className="absolute inset-x-0 bottom-24 flex items-center justify-center pointer-events-none transition-opacity duration-300">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/90 border border-primary/40 text-primary text-label-sm text-[11px] uppercase tracking-wider shadow-lg animate-bounce">
                      <span className="material-symbols-outlined text-[14px]">south</span>
                      <span>Scroll down to rotate 360°</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom scroll progression line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-high/30">
          <div
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-75 ease-out"
            style={{ width: `${Math.round(scrollProgress * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
