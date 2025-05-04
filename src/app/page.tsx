// src/app/page.tsx
// *** Fixing Idle Animation Visibility (Attempt 4) ***
// Moved immediate hide logic to handleActivity within useEffect.
// Simplified resetIdleTimer.
// Ensured correct useEffect dependencies.
// Kept console logs for idle state changes.
// Using event.currentTarget in handleMouseMove.
// Increased tilt intensity (30/-30).
// Reordered transform functions.
// Overflow-hidden removed from AppCard.
// Ref assignment fixed.
// All features (Particles, Easter Egg, Footer, GIF) re-enabled.

'use client'; // Needed for hooks and event listeners

import React, { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { useTheme } from 'next-themes';
// Import necessary icons
import { Sun, Moon, ExternalLink, Tv, Utensils, Film, Youtube, MessageSquare, Bot } from 'lucide-react';
import Image from 'next/image';


// --- Interfaces ---
interface Particle {
  id: number; x: number; y: number; vx: number; vy: number; opacity: number; size: number; color: string; life: number;
}

// --- Constants ---
const MAX_PARTICLES = 500;
const PARTICLES_PER_FRAME = 3;
const IDLE_TIMEOUT_MS = 5000; // 5 seconds for debugging
const IDLE_CHARACTER = <Bot size={36} />; // Use Lucide Bot icon
// const HIDE_ANIMATION_DURATION = 1000; // No longer needed for immediate hide
const EASTER_EGG_TOGGLE_COUNT = 5; // Number of toggles for easter egg
const EASTER_EGG_TIMEOUT_MS = 1500; // Time window for toggles (ms)
const RAINBOW_FLASH_DURATION_MS = 7000; // How long the rainbow flash lasts

// --- Theme Switcher Component ---
interface ThemeSwitcherProps {
  onThemeToggle: () => void; // Callback for when theme is toggled
}
const ThemeSwitcher = ({ onThemeToggle }: ThemeSwitcherProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Function to toggle the theme and notify the parent
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    onThemeToggle(); // Notify parent component that a toggle occurred
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

// --- App Card Component (Using event.currentTarget fix) ---
interface AppCardProps {
  title: string;
  linkUrl: string;
  icon: React.ElementType;
  bgColorClass: string;
  iconColorClass: string;
}
const AppCard = forwardRef<HTMLAnchorElement, AppCardProps>(
  ({ title, linkUrl, icon: Icon, bgColorClass, iconColorClass }, ref) => {
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    // *** Using event.currentTarget ***
    const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
      const cardElement = event.currentTarget; // Use currentTarget instead of ref
      const rect = cardElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - rect.width / 2;
      const mouseY = event.clientY - rect.top - rect.height / 2;
      // *** Increased Intensity to 30/-30 ***
      const rotateY = (mouseX / (rect.width / 2)) * 30; // Increased tilt intensity
      const rotateX = (mouseY / (rect.height / 2)) * -30; // Increased tilt intensity
      setRotate({ x: rotateX, y: rotateY });
    };

    // Mouse enter handler for hover state
    const handleMouseEnter = () => { setIsHovered(true); };
    // Mouse leave handler to reset hover state and rotation
    const handleMouseLeave = () => { setIsHovered(false); setRotate({ x: 0, y: 0 }); };

    // Calculate dynamic styles based on hover state
    const scaleValue = isHovered ? 1.05 : 1;
    const translateZValue = isHovered ? 30 : 0;

    // Construct the transform style string (Using reordered version)
    const transformStyle = `translateZ(${translateZValue}px) scale(${scaleValue}) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`;

    return (
      <a
        ref={ref} // Keep the ref for potential parent access (like idle anim positioning)
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        // Removed overflow-hidden from classes
        className={`app-card-link bg-card-light dark:bg-card-dark rounded-xl shadow-lg flex flex-col p-6 text-center items-center aspect-square justify-center group`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: '1000px',
          transform: transformStyle,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Added pointer-events-none to this inner div */}
        <div className="flex flex-col items-center justify-center pointer-events-none">
          {/* Icon container with background color transition */}
          <div className={`mb-4 p-5 rounded-full transition-colors duration-300 ${bgColorClass} bg-opacity-30 dark:bg-opacity-20 group-hover:bg-opacity-50 dark:group-hover:bg-opacity-30`}>
            <Icon className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-300 ${iconColorClass}`} />
          </div>
          {/* Title text */}
          <h3 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark transition-colors duration-300">{title}</h3>
        </div>
      </a>
    );
  }
);
AppCard.displayName = 'AppCard'; // Set display name for React DevTools


// --- Main Homepage Component (Fully Restored) ---
export default function HomePage() {
  const emailAddress = "jabroniwan@gmail.com";
  const youtubeLink = "https://www.youtube.com/@cortaku";
  // Memoize the apps array
  const apps = React.useMemo(() => [
    { title: "Overseerr", linkUrl: "https://overseerr.cortaku.com", icon: Film, bgColorClass: "bg-pastel-pink", iconColorClass: "text-rose-500 dark:text-pastel-pink" },
    { title: "Mealie", linkUrl: "https://mealie.cortaku.com", icon: Utensils, bgColorClass: "bg-pastel-green", iconColorClass: "text-emerald-600 dark:text-pastel-green" },
    { title: "Plex", linkUrl: "https://plex.cortaku.com", icon: Tv, bgColorClass: "bg-pastel-blue", iconColorClass: "text-sky-600 dark:text-pastel-blue" },
  ], []);

  // --- Particle System State and Refs ---
  const [particles, setParticles] = useState<Particle[]>([]);
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const particleIdCounterRef = useRef(0);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const currentParticleCountRef = useRef(0);

  // --- Idle Animation State and Refs ---
  const [showIdleCharacter, setShowIdleCharacter] = useState(false);
  const [idleCharacterPosition, setIdleCharacterPosition] = useState<{ top: number | string; left: number | string } | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]); // Ref needed for idle animation positioning
  const isIdleRef = useRef(false); // Tracks if the idle state is currently active

  // --- Easter Egg State and Refs ---
  const [themeToggleCount, setThemeToggleCount] = useState(0);
  const [showRainbowFlash, setShowRainbowFlash] = useState(false);
  const themeToggleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rainbowFlashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure cardRefs array has the correct length
  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, apps.length);
  }, [apps]);

  // Update particle count ref
  useEffect(() => {
    currentParticleCountRef.current = particles.length;
  }, [particles]);

  // --- Particle Creation ---
  const createParticle = useCallback((x: number, y: number) => {
    if (currentParticleCountRef.current >= MAX_PARTICLES) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 1;
    const life = Math.random() * 100 + 100;
    const size = Math.random() * 4 + 2;
    const colors = ['#fecdd3', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#fef08a', '#fbcfe8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newParticle: Particle = { id: particleIdCounterRef.current++, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, opacity: 1, size, color, life };
    setParticles(prev => [...prev, newParticle]);
  }, []); // No dependencies needed as it uses refs

  // --- Particle Animation Loop ---
  const animateParticles = useCallback(() => {
    const container = mainContainerRef.current;
    if (!container) {
        animationFrameRef.current = requestAnimationFrame(animateParticles);
        return;
    }
    const bounds = container.getBoundingClientRect();
    const containerWidth = bounds.width;
    const containerHeight = bounds.height;
    setParticles(prevParticles =>
        prevParticles
            .map(p => {
                let newVx = p.vx; let newVy = p.vy; let newX = p.x + newVx; let newY = p.y + newVy;
                const radius = p.size / 2;
                if (newX + radius > containerWidth || newX - radius < 0) { newX = Math.max(radius, Math.min(containerWidth - radius, newX)); newVx *= -0.85; }
                if (newY + radius > containerHeight || newY - radius < 0) { newY = Math.max(radius, Math.min(containerHeight - radius, newY)); newVy *= -0.85; }
                const newLife = p.life - 1; const newOpacity = Math.max(0, newLife / 100);
                return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, opacity: newOpacity, life: newLife };
            })
            .filter(p => p.life > 0 && p.opacity > 0)
    );
    if (isMouseDownRef.current) {
        for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
            if (currentParticleCountRef.current < MAX_PARTICLES) {
                createParticle(mousePosRef.current.x + (Math.random() - 0.5) * 10, mousePosRef.current.y + (Math.random() - 0.5) * 10);
            } else { break; }
        }
    }
    animationFrameRef.current = requestAnimationFrame(animateParticles);
  }, [createParticle]);

  // --- Idle Timer Logic (Corrected with isIdleRef - Attempt 4) ---
  const handleIdle = useCallback(() => {
    console.log(">>> Idle timer fired! Attempting to show character."); // DEBUG
    // *** Don't show if already considered idle ***
    if (isIdleRef.current) {
        console.log("Idle: Already idle, skipping."); // DEBUG
        return;
    }

    const availableCardIndices = apps.map((_, index) => index).filter(index => cardRefs.current[index] !== null);
    if (availableCardIndices.length === 0 || !mainContainerRef.current) {
        console.log("Idle: Cannot show - no cards or container."); // DEBUG
        return;
    }
    const randomIndex = availableCardIndices[Math.floor(Math.random() * availableCardIndices.length)];
    const cardEl = cardRefs.current[randomIndex];
    if (cardEl) {
        const cardRect = cardEl.getBoundingClientRect();
        const containerRect = mainContainerRef.current.getBoundingClientRect();
        const top = cardRect.top - containerRect.top - 10;
        const left = cardRect.left - containerRect.left + (cardRect.width * 0.5);
        console.log(`Idle: Setting position: top=${top.toFixed(0)}, left=${left.toFixed(0)}`); // DEBUG
        setIdleCharacterPosition({ top, left });
        console.log("Idle: Setting showIdleCharacter to true"); // DEBUG
        setShowIdleCharacter(true); // Show the character
        isIdleRef.current = true; // *** Mark as idle ***
    } else {
         console.log("Idle: Cannot show - selected card null."); // DEBUG
    }
  }, [apps]); // Depends only on apps array

  // Simplified timer reset function
  const resetIdleTimer = useCallback(() => {
    // console.log("Resetting idle timer."); // DEBUG
    // Clear existing timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    // Set a new timer
    idleTimerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
  }, [handleIdle]); // Depends on handleIdle

  // --- Easter Egg Logic ---
  
const handleThemeToggleCallback = useCallback(() => {
  if (themeToggleTimerRef.current) {
    clearTimeout(themeToggleTimerRef.current);
    themeToggleTimerRef.current = null;
  }

  const newCount = themeToggleCount + 1;
  setThemeToggleCount(newCount);

  if (newCount >= EASTER_EGG_TOGGLE_COUNT) {
    setShowRainbowFlash(true);
    setThemeToggleCount(0); // reset count

    if (rainbowFlashTimerRef.current) clearTimeout(rainbowFlashTimerRef.current);
    rainbowFlashTimerRef.current = setTimeout(() => {
      setShowRainbowFlash(false);
      rainbowFlashTimerRef.current = null;
    }, RAINBOW_FLASH_DURATION_MS);
  } else {
    themeToggleTimerRef.current = setTimeout(() => {
      setThemeToggleCount(0);
      themeToggleTimerRef.current = null;
    }, EASTER_EGG_TIMEOUT_MS);
  }
}, [themeToggleCount]);


  // --- Event Handlers ---
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!mainContainerRef.current) return; isMouseDownRef.current = true;
    const rect = mainContainerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left; const y = event.clientY - rect.top;
    mousePosRef.current = { x, y };
    const canEmitCount = MAX_PARTICLES - currentParticleCountRef.current;
    const initialBurstCount = Math.min(10, canEmitCount);
    for (let i = 0; i < initialBurstCount; i++) { createParticle(x + (Math.random() - 0.5) * 5, y + (Math.random() - 0.5) * 5); }
  }, [createParticle]);

  const handleMouseUp = useCallback(() => { isMouseDownRef.current = false; }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!mainContainerRef.current || !isMouseDownRef.current) return;
    const rect = mainContainerRef.current.getBoundingClientRect();
    mousePosRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []); // No dependency on isMouseDownRef needed

  // --- Effect for All Features ---
  useEffect(() => {
    console.log(">>> Setting up effects <<<"); // DEBUG
    // Start particle animation
    animationFrameRef.current = requestAnimationFrame(animateParticles);

    // Activity detection
    const handleActivity = () => {
  if (isIdleRef.current) {
    console.log("Reset: Hiding character with animation");
    const el = document.querySelector('.idle-character');
    if (el) el.classList.add('hiding');
    setTimeout(() => {
      setShowIdleCharacter(false);
      setIdleCharacterPosition(null);
      isIdleRef.current = false;
      if (el) el.classList.remove('hiding');
    }, 1000); // Matches the hide-behind animation duration
  }
  resetIdleTimer();
};
    const eventTypes: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    eventTypes.forEach(type => window.addEventListener(type, handleActivity, { passive: true }));
    resetIdleTimer(); // Start idle timer initially

    // Particle mouse up listener
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
        console.log(">>> Cleaning up effects <<<"); // DEBUG
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        eventTypes.forEach(type => window.removeEventListener(type, handleActivity));
        window.removeEventListener('mouseup', handleMouseUp);
        isMouseDownRef.current = false;
        if (themeToggleTimerRef.current) clearTimeout(themeToggleTimerRef.current);
        if (rainbowFlashTimerRef.current) clearTimeout(rainbowFlashTimerRef.current);
    };
    // *** Corrected dependencies ***
  }, [animateParticles, handleMouseUp, resetIdleTimer]); // resetIdleTimer depends on handleIdle which depends on apps


  // Determine idle character class name (Simplified)
  const idleCharacterClassName = `idle-character ${showIdleCharacter ? 'visible' : ''}`;


  return (
    <div
      ref={mainContainerRef}
      className="bg-bg-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {/* Preload cursor */}
      <div className="preload-slash-cursor" aria-hidden="true"></div>

      {/* Main heading */}
      <h1 className="text-5xl sm:text-6xl font-bold mb-8 sm:mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-pastel-pink via-pastel-purple to-pastel-blue dark:from-pastel-pink dark:via-pastel-purple dark:to-pastel-blue text-shadow z-20">
        Cortaku
      </h1>

      {/* Grid container */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-xl w-full z-20 relative"
      >
        {apps.map((app, index) => (
            <AppCard
                key={app.title}
                ref={el => { cardRefs.current[index] = el; }} // Correct ref assignment
                {...app}
            />
        ))}
      </div>

       {/* Coffee GIF Image */}
       <div className="mt-8 z-10">
         <Image
           src="/art/coffee.gif"
           alt="Coffee steaming GIF"
           width={100}
           height={100}
           className="block mx-auto"
           unoptimized
         />
       </div>


      {/* Particle Container */}
      <div className="particle-container">
        {particles.map(p => (
            <div
                key={p.id}
                className="particle"
                style={{
                    left: `${p.x}px`, top: `${p.y}px`, width: `${p.size}px`,
                    height: `${p.size}px`, backgroundColor: p.color, opacity: p.opacity,
                    transform: 'translate(-50%, -50%)'
                }}
            />
        ))}
      </div>

      {/* Idle Character Easter Egg */}
      <div
        className={idleCharacterClassName} // Use updated className logic
        // *** Simplified style: rely only on CSS class for opacity ***
        style={idleCharacterPosition ? { top: `${idleCharacterPosition.top}px`, left: `${idleCharacterPosition.left}px`, transform: 'translate(-50%, -50%)' } : {}}
        aria-hidden="true"
      >
        {IDLE_CHARACTER}
      </div>

      {/* Rainbow Flash Easter Egg Overlay */}
      {showRainbowFlash && (
		  <div
			className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none overflow-hidden"
			style={{
			  background: 'linear-gradient(45deg, red, orange, yellow, lime, cyan, blue, magenta, red)',
			  backgroundSize: '200% 200%',
			  animation: 'rainbow-bg 2s ease-in-out infinite, fade-in-out 7s ease-in-out forwards'
			}}
			aria-hidden="true"
		  >
			<audio src="/sounds/grunt-party.mp3" autoPlay preload="auto" />
			<div className="absolute w-full whitespace-nowrap animate-marquee text-4xl">
			  {Array.from({ length: 30 }).map((_, i) => (
				<span key={`emoji-${i}`} className="inline-block mx-2">🌈</span>
			  ))}
			</div>
		  </div>
		)}
        {/* Reminder: Add keyframes to global CSS */}


      {/* Footer section */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center w-full z-20">
        {/* Social Links */}
        <div className="flex space-x-4">
          {/* Mailto link */}
          <a href={`mailto:${emailAddress}`} aria-label="Email" className="text-text-muted-light dark:text-text-muted-dark hover:text-pastel-purple transition duration-300">
              <MessageSquare className="w-5 h-5" />
          </a>
          {/* YouTube link */}
          <a href={youtubeLink} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-text-muted-light dark:text-text-muted-dark hover:text-red-400 transition duration-300">
              <Youtube className="w-5 h-5" />
          </a>
        </div>
        {/* Theme Switcher Component */}
        <ThemeSwitcher onThemeToggle={handleThemeToggleCallback} />
      </footer>
    </div>
  );
}
