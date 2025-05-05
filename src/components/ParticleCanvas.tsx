// src/components/ParticleCanvas.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  color: string;
  life: number;
}

const MAX_PARTICLES = 500;
const PARTICLES_PER_FRAME = 3;

const ParticleCanvas = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const particleIdCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentParticleCountRef = useRef(0);

  const createParticle = (x: number, y: number) => {
    if (currentParticleCountRef.current >= MAX_PARTICLES) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 1;
    const life = Math.random() * 100 + 100;
    const size = Math.random() * 4 + 2;
    const colors = ['#fecdd3', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#fef08a', '#fbcfe8'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newParticle: Particle = {
      id: particleIdCounterRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: 1,
      size,
      color,
      life
    };
    setParticles(prev => [...prev, newParticle]);
  };

  const animateParticles = () => {
    const container = containerRef.current;
    if (!container) {
      animationFrameRef.current = requestAnimationFrame(animateParticles);
      return;
    }
    const bounds = container.getBoundingClientRect();
    const containerWidth = bounds.width;
    const containerHeight = bounds.height;
    setParticles(prevParticles => {
      const updated = prevParticles
        .map(p => {
          let newVx = p.vx;
          let newVy = p.vy;
          let newX = p.x + newVx;
          let newY = p.y + newVy;
          const radius = p.size / 2;
          if (newX + radius > containerWidth || newX - radius < 0) {
            newX = Math.max(radius, Math.min(containerWidth - radius, newX));
            newVx *= -0.85;
          }
          if (newY + radius > containerHeight || newY - radius < 0) {
            newY = Math.max(radius, Math.min(containerHeight - radius, newY));
            newVy *= -0.85;
          }
          const newLife = p.life - 1;
          const newOpacity = Math.max(0, newLife / 100);
          return {
            ...p,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            opacity: newOpacity,
            life: newLife
          };
        })
        .filter(p => p.life > 0 && p.opacity > 0);
      currentParticleCountRef.current = updated.length;
      return updated;
    });

    if (isMouseDownRef.current) {
      for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
        if (currentParticleCountRef.current < MAX_PARTICLES) {
          createParticle(
            mousePosRef.current.x + (Math.random() - 0.5) * 10,
            mousePosRef.current.y + (Math.random() - 0.5) * 10
          );
        } else {
          break;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(animateParticles);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    isMouseDownRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y };
    for (let i = 0; i < 10; i++) {
      createParticle(x + (Math.random() - 0.5) * 5, y + (Math.random() - 0.5) * 5);
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isMouseDownRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div
      ref={containerRef}
      className="particle-container"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  );
};

export default ParticleCanvas;
