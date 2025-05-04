// src/app/test/page.tsx
// Minimal reproduction page to test AppCard hover animation in isolation.
// Increased tilt intensity for better visibility.

'use client'; // Needed for hooks and event listeners

import React, { useState, useRef, forwardRef } from 'react';
// Import an example icon
import { Film } from 'lucide-react';

// --- App Card Component (Increased Tilt Intensity) ---
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

    // Mouse move handler for 3D tilt effect
    const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
      const cardElement = (ref as React.RefObject<HTMLAnchorElement>)?.current;
      if (!cardElement) return;
      const rect = cardElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - rect.width / 2;
      const mouseY = event.clientY - rect.top - rect.height / 2;
      // *** INCREASED INTENSITY: Changed 15 to 30 ***
      const rotateY = (mouseX / (rect.width / 2)) * 30; // Increased tilt intensity
      const rotateX = (mouseY / (rect.height / 2)) * -30; // Increased tilt intensity
      setRotate({ x: rotateX, y: rotateY });
    };

    // Mouse enter handler for hover state
    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    // Mouse leave handler to reset hover state and rotation
    const handleMouseLeave = () => {
      setIsHovered(false);
      setRotate({ x: 0, y: 0 });
    };

    // Calculate dynamic styles based on hover state
    const scaleValue = isHovered ? 1.05 : 1;
    const translateZValue = isHovered ? 30 : 0;

    // Construct the transform style string (Using reordered version)
    const transformStyle = `translateZ(${translateZValue}px) scale(${scaleValue}) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`;

    return (
      <a
        ref={ref}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`app-card-link bg-card-light dark:bg-card-dark rounded-xl shadow-lg overflow-hidden flex flex-col p-6 text-center items-center aspect-square justify-center group`}
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


// --- Minimal Test Page Component ---
export default function TestPage() {
  // Ref needed for the AppCard component (even if not used directly here)
  const cardRef = useRef<HTMLAnchorElement | null>(null);

  // Define props for a single card
  const testApp = {
    title: "Test Card",
    linkUrl: "#", // Dummy link
    icon: Film, // Example icon
    bgColorClass: "bg-pastel-blue",
    iconColorClass: "text-sky-600 dark:text-pastel-blue"
  };

  return (
    // Simple container to center the card
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark p-10">
       {/* Render a single AppCard */}
       <div className="w-48"> {/* Set a width for the card container */}
            <AppCard
                ref={cardRef} // Pass the ref
                {...testApp} // Spread the props
            />
       </div>
    </div>
  );
}
