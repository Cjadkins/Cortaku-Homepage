// src/components/JumpGame.tsx

'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  fontSize: number;
}

interface JumpGameProps {
  onExit: () => void;
}

const JumpGame: React.FC<JumpGameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const robot = useRef({ x: 100, y: 0, vy: 0, width: 80, height: 80, jumping: false });
  const gravity = 0.8;
  const jumpStrength = -15;
  const groundY = 300;
  const frameIndex = useRef(0);
  const groundOffset = useRef(0);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const lastDeltaFrameTimeRef = useRef<number | null>(null);
  const lastSpeedIncreaseTimeRef = useRef<number>(performance.now());
  const frameDelay = 120;
  const animationFrameRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('highScore') || '0');
    }
    return 0;
  });
  const currentSpeed = useRef(5);
  const scoreMultiplier = 0.01;
  const gameOverRef = useRef(false);
  const [gameOver, setGameOver] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const obstaclesRef = useRef<Obstacle[]>([]);
  const nextObstacleId = useRef(0);
  const lastObstacleSpawnTimeRef = useRef(performance.now());
  const nextObstacleSpawnDelayRef = useRef(2500);
  const minObstacleSpawnDelay = 2000;
  const maxObstacleSpawnDelay = 4000;

  const getRandomSpawnDelay = () => Math.random() * (maxObstacleSpawnDelay - minObstacleSpawnDelay) + minObstacleSpawnDelay;
  const getRandomFontSize = () => Math.random() * 32 + 24;

  const checkCollision = () => {
    const robotRect = {
      x: robot.current.x + robot.current.width * 0.15,
      y: robot.current.y + robot.current.height * 0.1,
      width: robot.current.width * 0.7,
      height: robot.current.height * 0.8
    };
    for (const obs of obstaclesRef.current) {
      const hitboxShrinkFactor = 0.6;
      const obsRect = {
        x: obs.x + (obs.width * (1 - hitboxShrinkFactor)) / 2,
        y: groundY + robot.current.height - obs.height * hitboxShrinkFactor,
        width: obs.width * hitboxShrinkFactor,
        height: obs.height * hitboxShrinkFactor
      };
      if (
        robotRect.x < obsRect.x + obsRect.width &&
        robotRect.x + robotRect.width > obsRect.x &&
        robotRect.y < obsRect.y + obsRect.height &&
        robotRect.y + robotRect.height > obsRect.y
      ) {
        return true;
      }
    }
    return false;
  };

  const resetGame = () => {
    gameOverRef.current = false;
    setGameOver(false);
    setFadeOpacity(0);
    robot.current = { x: 100, y: 0, vy: 0, width: 80, height: 80, jumping: false };
    scoreRef.current = 0;
    setScore(0);
    currentSpeed.current = 5;
    groundOffset.current = 0;
    frameIndex.current = 0;
    obstaclesRef.current = [];
    nextObstacleId.current = 0;
    lastFrameTimeRef.current = performance.now();
    lastDeltaFrameTimeRef.current = null;
    lastSpeedIncreaseTimeRef.current = performance.now();
    lastObstacleSpawnTimeRef.current = performance.now();
    nextObstacleSpawnDelayRef.current = 2500;
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      onExit();
    } else if (gameOverRef.current && e.code === 'Space') {
      resetGame();
    } else if (!gameOverRef.current && (e.code === 'Space' || e.code === 'ArrowUp')) {
      if (!robot.current.jumping) {
        robot.current.vy = jumpStrength;
        robot.current.jumping = true;
      }
    }
  }, [onExit]);

  const loop = useCallback((time: number) => {
    if (gameOverRef.current) return;
    animationFrameRef.current = requestAnimationFrame(loop);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const delta = time - lastFrameTimeRef.current;
    if (delta < 1000 / 60) return;
    lastFrameTimeRef.current = time;

    scoreRef.current += delta * scoreMultiplier;
    setScore(Math.floor(scoreRef.current));

    if (time - lastSpeedIncreaseTimeRef.current > 5000 && currentSpeed.current < 8) {
      currentSpeed.current = Math.min(currentSpeed.current + 0.2, 8);
      lastSpeedIncreaseTimeRef.current = time;
    }

    if (time - lastObstacleSpawnTimeRef.current > nextObstacleSpawnDelayRef.current) {
      const fontSize = getRandomFontSize();
      obstaclesRef.current.push({
        id: nextObstacleId.current++,
        x: canvas.width,
        width: fontSize * 0.6,
        height: fontSize * 0.8,
        fontSize
      });
      lastObstacleSpawnTimeRef.current = time;
      nextObstacleSpawnDelayRef.current = getRandomSpawnDelay();
    }

    if (!spriteRef.current) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    robot.current.vy += gravity;
    robot.current.y += robot.current.vy;
    if (robot.current.y > groundY) {
      robot.current.y = groundY;
      robot.current.vy = 0;
      robot.current.jumping = false;
    }

    const tileWidth = 40;
    groundOffset.current = (groundOffset.current - currentSpeed.current);
    if (groundOffset.current <= -tileWidth) {
      groundOffset.current += tileWidth;
    }

    ctx.fillStyle = '#444';
    for (let x = groundOffset.current - tileWidth; x < canvas.width; x += tileWidth) {
      ctx.fillRect(Math.floor(x), groundY + robot.current.height, tileWidth - 2, canvas.height - (groundY + robot.current.height));
    }

    obstaclesRef.current = obstaclesRef.current.filter(o => o.x + o.width > 0);
    for (const obs of obstaclesRef.current) {
      obs.x -= currentSpeed.current;
      ctx.font = `${obs.fontSize}px serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('💩', obs.x, groundY + robot.current.height);
    }

    if (checkCollision()) {
      gameOverRef.current = true;
      setFadeOpacity(0);
      setTimeout(() => setGameOver(true), 0);
      audioRef.current?.play();
      const finalScore = Math.floor(scoreRef.current);
      const storedHighScore = Number(localStorage.getItem('highScore') || '0');
      if (finalScore > storedHighScore) {
        localStorage.setItem('highScore', finalScore.toString());
        setHighScore(finalScore);
      } else {
        setHighScore(storedHighScore);
      }
      return;
    }

    const spriteCols = 5;
    const spriteRows = 2;
    const totalFrames = 7;
    const frameWidth = 1600 / spriteCols;
    const frameHeight = 640 / spriteRows;

    if (time - (lastDeltaFrameTimeRef.current ?? 0) >= frameDelay) {
      frameIndex.current = (frameIndex.current + 1) % totalFrames;
      lastDeltaFrameTimeRef.current = time;
    }
    const sx = (frameIndex.current % spriteCols) * frameWidth;
    const sy = Math.floor(frameIndex.current / spriteCols) * frameHeight;
    ctx.drawImage(
      spriteRef.current,
      sx,
      sy,
      frameWidth,
      frameHeight,
      robot.current.x,
      robot.current.y,
      robot.current.width,
      robot.current.height
    );

    ctx.save();
    ctx.fillStyle = 'red';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 16, 12);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to try again', canvas.width / 2, 20);
    ctx.restore();
  }, [checkCollision]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    canvas.width = canvas.clientWidth || 800;
    canvas.height = 400;

    const sprite = new Image();
    sprite.src = '/game-assets/robot-sprite.png';
    spriteRef.current = sprite;

    sprite.onload = () => {
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, loop]);

  useEffect(() => {
    if (gameOver) {
      let opacity = 0;
      const interval = setInterval(() => {
        opacity += 0.024;
        setFadeOpacity(Math.min(opacity, 1));
        if (opacity >= 1) clearInterval(interval);
      }, 60);
      return () => clearInterval(interval);
    }
  }, [gameOver]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <canvas ref={canvasRef} className="bg-gray-900 rounded shadow-lg border border-white w-full max-w-4xl" />
      <audio ref={audioRef} src="/game-assets/death_sound.mp3" preload="auto" />
      {gameOver && (
        <div
          className="absolute flex flex-col items-center justify-center w-full h-full"
          style={{ zIndex: 50, pointerEvents: 'none' }}
        >
          <img
            src="/game-assets/you_died.png"
            alt="You Died"
            style={{
              opacity: fadeOpacity,
              transition: 'opacity 1.2s ease-in-out',
              width: '540px',
              height: 'auto',
            }}
          />
          <p className="text-white font-semibold mt-4" style={{ opacity: fadeOpacity }}>
            Press SPACE to retry
          </p>
          <div className="text-center mt-4 space-y-2" style={{ opacity: fadeOpacity, transition: 'opacity 0.5s ease-in-out' }}>
            <p className="text-text-main-light dark:text-text-main-dark text-lg font-semibold">Final Score: {score}</p>
            <p className="text-text-main-light dark:text-text-main-dark text-md">High Score: {highScore}</p>
          </div>
        </div>
      )}
      <p className="text-center mt-4 text-text-main-light dark:text-text-main-dark text-sm">
        Press <strong>SPACE</strong> to jump, <strong>ESC</strong> to return
      </p>
    </div>
  );
};

export default JumpGame;
