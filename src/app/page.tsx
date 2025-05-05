// src/app/page.tsx
// *** Reduced rainbow effect duration and increased marquee speed ***

'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { useTheme } from 'next-themes';
import {
  Sun, Moon, Tv, Utensils, Film, Youtube, MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import JumpGame from '@/components/JumpGame';

interface Particle {
  id: number; x: number; y: number; vx: number; vy: number; opacity: number; size: number; color: string; life: number;
}

const MAX_PARTICLES = 1000;
const PARTICLES_PER_FRAME = 10;

const ThemeSwitcher = ({ onThemeToggle }: { onThemeToggle: () => void }) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    onThemeToggle();
  };
  return (
    <button
      onClick={toggleTheme}
      className="emoji-button p-2 rounded-full hover:bg-card-light/50 dark:hover:bg-card-dark/50 transition-colors duration-200 text-2xl"
      aria-label="Toggle Theme"
      style={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif' }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

const AppCard = forwardRef<HTMLAnchorElement, {
  title: string;
  linkUrl: string;
  icon: React.ElementType;
  bgColorClass: string;
  iconColorClass: string;
}>(({ title, linkUrl, icon: Icon, bgColorClass, iconColorClass }, ref) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - rect.width / 2;
    const mouseY = event.clientY - rect.top - rect.height / 2;
    setRotate({
      y: (mouseX / (rect.width / 2)) * 30,
      x: (mouseY / (rect.height / 2)) * -30
    });
  };
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => { setIsHovered(false); setRotate({ x: 0, y: 0 }); };
  const transformStyle = `translateZ(${isHovered ? 30 : 0}px) scale(${isHovered ? 1.05 : 1}) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`;
  return (
    <a
      ref={ref}
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="app-card-link bg-card-light dark:bg-card-dark rounded-xl shadow-lg flex flex-col p-6 text-center items-center aspect-square justify-center group"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px', transform: transformStyle, transition: 'transform 0.3s ease-out' }}
    >
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <div className={`mb-4 p-5 rounded-full transition-colors duration-300 ${bgColorClass} bg-opacity-30 dark:bg-opacity-20 group-hover:bg-opacity-50 dark:group-hover:bg-opacity-30`}>
          <Icon className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-300 ${iconColorClass}`} />
        </div>
        <h3 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark transition-colors duration-300">{title}</h3>
      </div>
    </a>
  );
});
AppCard.displayName = 'AppCard';

export default function HomePage() {
  const emailAddress = "jabroniwan@gmail.com";
  const youtubeLink = "https://www.youtube.com/@cortaku";
  const apps = React.useMemo(() => [
    { title: "Overseerr", linkUrl: "https://overseerr.cortaku.com", icon: Film, bgColorClass: "bg-pastel-pink", iconColorClass: "text-rose-500 dark:text-pastel-pink" },
    { title: "Mealie", linkUrl: "https://mealie.cortaku.com", icon: Utensils, bgColorClass: "bg-pastel-green", iconColorClass: "text-emerald-600 dark:text-pastel-green" },
    { title: "Plex", linkUrl: "https://plex.cortaku.com", icon: Tv, bgColorClass: "bg-pastel-blue", iconColorClass: "text-sky-600 dark:text-pastel-blue" },
  ], []);

  const [showGame, setShowGame] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseDownRef = useRef(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const [toggleCount, setToggleCount] = useState(0);
  const [showRainbow, setShowRainbow] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleThemeToggle = useCallback(() => {
    setToggleCount(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setShowRainbow(true);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.warn("Audio play error:", err));
        }
        setTimeout(() => setShowRainbow(false), 5000); // Reduced to 5 seconds
        return 0;
      }
      return next;
    });
  }, []);

  const handleGameExit = useCallback(() => setShowGame(false), []);

  const emitParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = Array.from({ length: PARTICLES_PER_FRAME }).map(() => ({
      id: Math.random(), x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, opacity: 1,
      size: Math.random() * 6 + 3,
      color: ['#fecdd3', '#bfdbfe', '#bbf7d0', '#fef08a', '#fbcfe8'][Math.floor(Math.random() * 5)],
      life: 120
    }));
    setParticles(p => [...p, ...newParticles].slice(-MAX_PARTICLES));
  }, []);

  useEffect(() => {
    const animate = () => {
      setParticles(prev => prev.map(p => {
        const newX = p.x + p.vx, newY = p.y + p.vy;
        const newVx = (containerRef.current && (newX <= 0 || newX >= containerRef.current.clientWidth)) ? -p.vx : p.vx;
        const newVy = (containerRef.current && (newY <= 0 || newY >= containerRef.current.clientHeight)) ? -p.vy : p.vy;
        return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, life: p.life - 1, opacity: Math.max(0, (p.life - 1) / 120) };
      }).filter(p => p.life > 0));
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownRef.current = true;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      emitParticles(mousePos.current.x, mousePos.current.y);
    }
  };
  const handleMouseUp = () => { mouseDownRef.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (mouseDownRef.current) emitParticles(mousePos.current.x, mousePos.current.y);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden ${showRainbow ? 'bg-rainbow' : 'bg-bg-light dark:bg-bg-dark'} text-text-main-light dark:text-text-main-dark`}
    >
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full" style={{ width: `${p.size}px`, height: `${p.size}px`, backgroundColor: p.color, opacity: p.opacity, left: `${p.x}px`, top: `${p.y}px`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 5 }} />
      ))}

      {showRainbow && (
        <>
          <div className="absolute inset-0 bg-white animate-flashRainbow z-40 pointer-events-none" />
          <div className="absolute top-10 w-full text-6xl z-50 pointer-events-none whitespace-nowrap overflow-hidden animate-marquee-fast">
            🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈
          </div>
          <div className="absolute inset-0 z-40 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, fontSize: `${Math.random() * 30 + 20}px`, animation: 'float 7s linear infinite' }}>
                🌈
              </div>
            ))}
          </div>
        </>
      )}
      <audio ref={audioRef} src="/sounds/grunt_party.mp3" preload="auto" />

      {showGame ? (
        <JumpGame onExit={handleGameExit} />
      ) : (
        <>
          <h1
            onClick={() => setShowGame(true)}
            className="select-none text-5xl sm:text-6xl font-bold mb-8 sm:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-pastel-pink via-pastel-purple to-pastel-blue dark:from-pastel-pink dark:via-pastel-purple dark:to-pastel-blue text-shadow z-20 cursor-pointer"
            style={{ cursor: 'url(/cursors/sword-slash.svg), auto' }}
          >
            Cortaku
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-xl w-full z-20 relative">
            {apps.map(app => (<AppCard key={app.title} {...app} />))}
          </div>

          <footer className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center w-full z-20">
            <div className="flex space-x-4">
              <a href={`mailto:${emailAddress}`} aria-label="Email" className="text-text-muted-light dark:text-text-muted-dark hover:text-pastel-purple transition duration-300">
                <MessageSquare className="w-5 h-5" />
              </a>
              <a href={youtubeLink} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-text-muted-light dark:text-text-muted-dark hover:text-red-400 transition duration-300">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            <ThemeSwitcher onThemeToggle={handleThemeToggle} />
          </footer>
        </>
      )}
    </div>
  );
}
