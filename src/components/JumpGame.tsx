'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// --------------- INTERFACES ---------------
interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  fontSize: number;
}

interface JumpGameProps {
  onExit: () => void;
  gameTheme: 'day' | 'night';
}

interface BackgroundLayer {
  image: HTMLImageElement | null;
  src: string;
  x: number;
  speedMultiplier: number;
  y: number;
  width: number;
  height: number;
  isLoaded: boolean;
  isBaseLayer?: boolean;
}

// --------------- CONSTANTS ---------------
const GAME_INTERNAL_WIDTH = 800;
const GAME_INTERNAL_HEIGHT = 450;
const GAME_ASPECT_RATIO = 16 / 9;

const TARGET_FPS_FOR_ORIGINAL_BALANCE = 60;
const GRAVITY_ACCEL_PPS2 = 1.0 * TARGET_FPS_FOR_ORIGINAL_BALANCE * TARGET_FPS_FOR_ORIGINAL_BALANCE;
const JUMP_INITIAL_VELOCITY_PPS = -15 * TARGET_FPS_FOR_ORIGINAL_BALANCE;
const INITIAL_GAME_SPEED_PPS = 5 * TARGET_FPS_FOR_ORIGINAL_BALANCE;
const MAX_GAME_SPEED_PPS = 100 * TARGET_FPS_FOR_ORIGINAL_BALANCE;
const GAME_SPEED_INCREMENT_PPS = 1.4 * TARGET_FPS_FOR_ORIGINAL_BALANCE;

const exitButtonConfig = {
  radius: 25,
  padding: 15,
  get x() { return GAME_INTERNAL_WIDTH - this.radius - this.padding; },
  get y() { return this.radius + this.padding; },
};

// --------------- JUMP GAME COMPONENT ---------------
const JumpGame: React.FC<JumpGameProps> = ({ onExit, gameTheme }) => {
  // --------------- STATE ---------------
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [highScore, setHighScore] = useState(() =>
    typeof window !== 'undefined' ? Number(localStorage.getItem('highScore') || '0') : 0
  );
  const [currentBackgroundSet, setCurrentBackgroundSet] = useState<number>(1);

  // --------------- REFS ---------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const loopRef = useRef<((time: number) => void) | null>(null);

  const robot = useRef({ x: 100, y: 0, vy: 0, width: 80, height: 80, jumping: false });
  const groundY = GAME_INTERNAL_HEIGHT - robot.current.height - 100;

  const gameStartedRef = useRef(gameStarted);
  const gameOverRef = useRef(gameOver);

  const frameIndex = useRef(0);
  const groundOffset = useRef(0);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const youDiedImageRef = useRef<HTMLImageElement | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const lastDeltaFrameTimeRef = useRef<number | null>(null);
  const frameDelay = 120;

  const scoreRef = useRef(0);
  const currentSpeed = useRef(INITIAL_GAME_SPEED_PPS);
  const lastSpeedIncreaseTimeRef = useRef<number>(performance.now());
  const scoreMultiplier = 0.01;

  const fadeOpacityRef = useRef(0);
  const allowRestartRef = useRef(false);
  
  const deathAudioRef = useRef<HTMLAudioElement | null>(null);
  const jumpAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundtrackAudioRef = useRef<HTMLAudioElement | null>(null);

  const backgroundLayersRef = useRef<BackgroundLayer[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const nextObstacleId = useRef(0);
  const lastObstacleSpawnTimeRef = useRef<number>(performance.now());
  const nextObstacleSpawnDelayRef = useRef(2000);
  const minObstacleSpawnDelay = 500;
  const maxObstacleSpawnDelay = 3800;

  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isExitingRef = useRef<boolean>(false);

  // --------------- REF SYNCHRONIZATION ---------------
  useEffect(() => { gameStartedRef.current = gameStarted; }, [gameStarted]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  // --------------- HELPER FUNCTIONS (MEMOIZED WHERE BENEFICIAL) ---------------
  const getRandomSpawnDelay = useCallback(() => Math.random() * (maxObstacleSpawnDelay - minObstacleSpawnDelay) + minObstacleSpawnDelay, [maxObstacleSpawnDelay, minObstacleSpawnDelay]);
  const getRandomFontSize = useCallback(() => Math.random() * 32 + 24, []);

  const isCollision = useCallback((r: { x: number, y: number, width: number, height: number }, o: Obstacle): boolean => {
    const shrinkFactor = 0.6;
    const robotBox = {
      x: r.x + (1 - shrinkFactor) * r.width / 2, y: r.y + (1 - shrinkFactor) * r.height / 2,
      width: r.width * shrinkFactor, height: r.height * shrinkFactor
    };
    const obstacleVisualTopY = groundY + robot.current.height - o.height;
    const obstacleBox = { x: o.x, y: obstacleVisualTopY, width: o.width, height: o.height };
    return (
      robotBox.x < obstacleBox.x + obstacleBox.width && robotBox.x + robotBox.width > obstacleBox.x &&
      robotBox.y < obstacleBox.y + obstacleBox.height && robotBox.y + robotBox.height > obstacleBox.y
    );
  }, [groundY]);

  const requestExitWithDelay = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    exitTimeoutRef.current = setTimeout(() => {
      onExit();
      isExitingRef.current = false; exitTimeoutRef.current = null;
    }, 300);
  }, [onExit]);
  
  const getLogicalCoordinates = useCallback((clientX: number, clientY: number, currentCanvas: HTMLCanvasElement, rect: DOMRect) => {
    const css_x = clientX - rect.left; const css_y = clientY - rect.top;
    let logicalX: number, logicalY: number;
    const isViewportPortrait = window.innerHeight > window.innerWidth;
    if (isViewportPortrait) {
        logicalX = (1 - css_y / rect.height) * GAME_INTERNAL_WIDTH;
        logicalY = (css_x / rect.width) * GAME_INTERNAL_HEIGHT;
    } else {
        logicalX = css_x * (GAME_INTERNAL_WIDTH / rect.width);
        logicalY = css_y * (GAME_INTERNAL_HEIGHT / rect.height);
    }
    return { logicalX, logicalY };
  }, []);

  // --------------- CORE GAME ACTIONS ---------------
  const handleJump = useCallback(() => {
    if (!gameStartedRef.current || robot.current.jumping || gameOverRef.current) return;
    robot.current.vy = JUMP_INITIAL_VELOCITY_PPS;
    robot.current.jumping = true;
    if (jumpAudioRef.current) {
      jumpAudioRef.current.currentTime = 0;
      jumpAudioRef.current.play().catch(error => console.error("Error playing jump sound:", error));
    }
  }, []);

  const resetGame = useCallback(() => {
    gameOverRef.current = false; setGameOver(false); 
    fadeOpacityRef.current = 0; scoreRef.current = 0;
    robot.current.y = groundY; robot.current.vy = 0; robot.current.jumping = false;
    obstaclesRef.current = []; currentSpeed.current = INITIAL_GAME_SPEED_PPS;
    lastSpeedIncreaseTimeRef.current = performance.now();
    lastObstacleSpawnTimeRef.current = performance.now();
    nextObstacleSpawnDelayRef.current = getRandomSpawnDelay();
    allowRestartRef.current = false; setTimeout(() => { allowRestartRef.current = true; }, 500);
    lastFrameTimeRef.current = performance.now();

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (loopRef.current) animationFrameRef.current = requestAnimationFrame(loopRef.current);
  }, [groundY, getRandomSpawnDelay]);

  const handleStartGame = useCallback(() => {
    if (gameStartedRef.current) return;
    if (!audioUnlocked) {
      if (soundtrackAudioRef.current) {
        soundtrackAudioRef.current.muted = false; soundtrackAudioRef.current.volume = 0.3; 
        const playPromise = soundtrackAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setAudioUnlocked(true))
                     .catch(error => { console.error("Soundtrack play failed on Start:", error); setAudioUnlocked(true); });
        } else { setAudioUnlocked(true); }
      } else { setAudioUnlocked(true); }
    }
    setGameStarted(true); 
    resetGame();
  }, [audioUnlocked, resetGame]);
  
  // --------------- GAME LOOP ---------------
  const gameLoop = useCallback((time: number) => {
    animationFrameRef.current = requestAnimationFrame(gameLoop); 
    
    const currentFrameTime = time;
    let deltaMs = currentFrameTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentFrameTime;

    // Safety cap for deltaMs to prevent extreme jumps if tab was hidden for a long time.
    if (deltaMs > 100) { 
        deltaMs = 100; 
    }
    const deltaTimeSeconds = deltaMs / 1000.0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_INTERNAL_WIDTH, GAME_INTERNAL_HEIGHT);

    // Draw Backgrounds
    const baseLayer = backgroundLayersRef.current.find(l => l.isBaseLayer && l.isLoaded && l.image);
    if (baseLayer) {
        ctx.drawImage(baseLayer.image!, 0, 0, baseLayer.width, baseLayer.height);
    } else {
        ctx.fillStyle = gameTheme === 'day' ? '#87CEEB' : '#0b1028';
        ctx.fillRect(0, 0, GAME_INTERNAL_WIDTH, GAME_INTERNAL_HEIGHT);
    }
    
    backgroundLayersRef.current.filter(l => !l.isBaseLayer && l.isLoaded && l.image).forEach(layer => {
        if (gameStartedRef.current && !gameOverRef.current) {
            const speedDelta = (currentSpeed.current * layer.speedMultiplier) * deltaTimeSeconds;
            layer.x -= speedDelta;
        }
        if (layer.width > 0 && layer.x <= -layer.width) { layer.x += layer.width; }
        ctx.drawImage(layer.image!, layer.x, layer.y, layer.width, layer.height);
        ctx.drawImage(layer.image!, layer.x + layer.width, layer.y, layer.width, layer.height);
        if (layer.width > 0 && (layer.x + layer.width * 2) < (GAME_INTERNAL_WIDTH + layer.width)) {
             ctx.drawImage(layer.image!, layer.x + layer.width * 2, layer.y, layer.width, layer.height);
        }
    });

    // Handle "Start Game" Screen
    if (!gameStartedRef.current) {
        ctx.font = '48px monospace';
        ctx.fillStyle = gameTheme === 'day' ? '#333333' : '#FFFFFF';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Start Game', GAME_INTERNAL_WIDTH / 2, GAME_INTERNAL_HEIGHT / 2 - 30);
        ctx.font = '24px monospace';
        ctx.fillText('Tap, Click, or Press Space', GAME_INTERNAL_WIDTH / 2, GAME_INTERNAL_HEIGHT / 2 + 30);
        return; 
    }

    // Game Logic & Updates (if game has started and not over)
    if (!gameOverRef.current) {
        const normalizedSpeed = currentSpeed.current / INITIAL_GAME_SPEED_PPS;
        scoreRef.current += deltaMs * Math.pow(normalizedSpeed, 1.5) * scoreMultiplier; 

        if (currentFrameTime - lastSpeedIncreaseTimeRef.current > 4000 && currentSpeed.current < MAX_GAME_SPEED_PPS) {
            currentSpeed.current = Math.min(currentSpeed.current + GAME_SPEED_INCREMENT_PPS, MAX_GAME_SPEED_PPS);
            lastSpeedIncreaseTimeRef.current = currentFrameTime;
        }
        if (currentFrameTime - lastObstacleSpawnTimeRef.current > nextObstacleSpawnDelayRef.current) {
            const fontSize = getRandomFontSize();
            obstaclesRef.current.push({ id: nextObstacleId.current++, x: GAME_INTERNAL_WIDTH, width: fontSize * 0.6, height: fontSize * 0.8, fontSize });
            lastObstacleSpawnTimeRef.current = currentFrameTime;
            nextObstacleSpawnDelayRef.current = getRandomSpawnDelay();
        }
        robot.current.vy += GRAVITY_ACCEL_PPS2 * deltaTimeSeconds;
        robot.current.y += robot.current.vy * deltaTimeSeconds;
        if (robot.current.y > groundY) { robot.current.y = groundY; robot.current.vy = 0; robot.current.jumping = false; }
        
        groundOffset.current -= currentSpeed.current * deltaTimeSeconds;
        if (groundOffset.current <= -40) groundOffset.current += 40;
        
        obstaclesRef.current = obstaclesRef.current.filter(o => o.x + o.width > 0);
        for (const obs of obstaclesRef.current) {
            obs.x -= currentSpeed.current * deltaTimeSeconds;
            if (isCollision(robot.current, obs)) {
                gameOverRef.current = true; setGameOver(true);
                allowRestartRef.current = false; setTimeout(() => { allowRestartRef.current = true; }, 2000);
                fadeOpacityRef.current = 0;
                if (deathAudioRef.current) { deathAudioRef.current.currentTime = 0; deathAudioRef.current.play().catch(e => console.error("Death sound error:", e));}
                if (scoreRef.current > highScore) { const newHS = Math.floor(scoreRef.current); setHighScore(newHS); localStorage.setItem('highScore', String(newHS));}
                break; 
            }
        }
        if (currentFrameTime - (lastDeltaFrameTimeRef.current ?? currentFrameTime) >= frameDelay) {
            frameIndex.current = (frameIndex.current + 1) % 7;
            lastDeltaFrameTimeRef.current = currentFrameTime;
        }
    }

    // Draw Game Elements (if game has started)
    const padding = 12;
    ctx.font = window.innerWidth < 600 ? '16px monospace' : '20px monospace';
    ctx.fillStyle = gameTheme === 'day' ? '#333333' : '#FFFFFF';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, padding, padding);
    ctx.fillText(`High Score: ${highScore}`, padding, padding + (window.innerWidth < 600 ? 20 : 26));

    const btnX = exitButtonConfig.x; const btnY = exitButtonConfig.y; const btnR = exitButtonConfig.radius;
    ctx.save(); ctx.beginPath(); ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 3; const xOff = btnR * 0.4;
    ctx.beginPath(); ctx.moveTo(btnX - xOff, btnY - xOff); ctx.lineTo(btnX + xOff, btnY + xOff);
    ctx.moveTo(btnX + xOff, btnY - xOff); ctx.lineTo(btnX - xOff, btnY + xOff); ctx.stroke(); ctx.restore();

    const tileW = 40; const groundTopY = groundY + robot.current.height;
    ctx.fillStyle = '#333';
    for (let xP = groundOffset.current - tileW; xP < GAME_INTERNAL_WIDTH; xP += tileW) { ctx.fillRect(Math.floor(xP), groundTopY, tileW - 4, 14); }
    
    for (const obs of obstaclesRef.current) {
        ctx.font = `${obs.fontSize}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(String.fromCodePoint(0x1F4A9), obs.x, groundTopY);
    }
    if (spriteRef.current) {
        const sC = 5, sR = 2; const fW = 1600 / sC, fH = 640 / sR;
        const sx = (frameIndex.current % sC) * fW; const sy = Math.floor(frameIndex.current / sC) * fH;
        ctx.drawImage(spriteRef.current, sx, sy, fW, fH, robot.current.x, robot.current.y, robot.current.width, robot.current.height);
    }
    if (gameOverRef.current && youDiedImageRef.current) {
        fadeOpacityRef.current = Math.min(fadeOpacityRef.current + (0.5 * deltaTimeSeconds), 1);
        const iW = 500, iH = 180; const dX = GAME_INTERNAL_WIDTH / 2 - iW / 2; const dY = GAME_INTERNAL_HEIGHT / 2 - iH / 2 - 20;
        const msg = window.innerWidth < 600 ? 'Tap to play again' : 'Press SPACE to play again';
        ctx.save(); ctx.globalAlpha = fadeOpacityRef.current;
        ctx.drawImage(youDiedImageRef.current, dX, dY, iW, iH);
        ctx.font = window.innerWidth < 600 ? '18px monospace' : '24px monospace';
        ctx.textAlign = 'center'; ctx.fillStyle = gameTheme === 'day' ? '#333333' : '#FFFFFF';
        ctx.fillText(msg, GAME_INTERNAL_WIDTH / 2, dY + iH + 40); ctx.restore();
    }
  }, [gameTheme, highScore, groundY, isCollision, getRandomFontSize, getRandomSpawnDelay, getLogicalCoordinates]); 

  useEffect(() => { loopRef.current = gameLoop; }, [gameLoop]);


  // --------------- EVENT HANDLERS (MEMOIZED) ---------------
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStartedRef.current) {
        if (e.code === 'Space' || e.code === 'Enter') handleStartGame();
        if (e.code === 'Escape') onExit(); 
        return;
    }
    if (e.repeat && e.code === 'Space') return;
    if (e.code === 'Escape') onExit();
    else if (gameOverRef.current && e.code === 'Space' && allowRestartRef.current) resetGame();
    else if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameOverRef.current) handleJump();
  }, [onExit, handleStartGame, resetGame, handleJump]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!gameStartedRef.current) { handleStartGame(); return; }
    event.preventDefault(); 
    const currentCanvas = canvasRef.current; if (!currentCanvas) return;
    const touch = event.touches[0]; if (!touch) return;
    const rect = currentCanvas.getBoundingClientRect();
    const { logicalX, logicalY } = getLogicalCoordinates(touch.clientX, touch.clientY, currentCanvas, rect);
    const dx = logicalX - exitButtonConfig.x; const dy = logicalY - exitButtonConfig.y;
    if (Math.sqrt(dx * dx + dy * dy) < exitButtonConfig.radius) requestExitWithDelay();
    else if (gameOverRef.current && allowRestartRef.current) resetGame();
    else if (!gameOverRef.current) handleJump();
  }, [getLogicalCoordinates, requestExitWithDelay, resetGame, handleJump, handleStartGame]);

  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!gameStartedRef.current) { handleStartGame(); return; }
    const currentCanvas = canvasRef.current; if (!currentCanvas) return;
    const rect = currentCanvas.getBoundingClientRect();
    const { logicalX, logicalY } = getLogicalCoordinates(event.clientX, event.clientY, currentCanvas, rect);
    const dx = logicalX - exitButtonConfig.x; const dy = logicalY - exitButtonConfig.y;
    if (Math.sqrt(dx * dx + dy * dy) < exitButtonConfig.radius) requestExitWithDelay();
  }, [getLogicalCoordinates, requestExitWithDelay, handleStartGame]);

  const handleResizeCanvas = useCallback(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const vpW = window.innerWidth; const vpH = window.innerHeight;
    const maxW = vpW * 0.90; const maxH = vpH * 0.90;
    cvs.width = GAME_INTERNAL_WIDTH; cvs.height = GAME_INTERNAL_HEIGHT;
    let sH = maxH; let sW = sH * GAME_ASPECT_RATIO;
    if (sW > maxW) { sW = maxW; sH = sW / GAME_ASPECT_RATIO; }
    sW = Math.max(1, Math.floor(sW)); sH = Math.max(1, Math.floor(sH));
    cvs.style.width = `${sW}px`; cvs.style.height = `${sH}px`;
    cvs.style.imageRendering = (sW > GAME_INTERNAL_WIDTH || sH > GAME_INTERNAL_HEIGHT) ? 'pixelated' : 'auto';
    const c = cvs.getContext('2d'); if (c) c.imageSmoothingEnabled = false;
  }, []);


  // --------------- USEEFFECT HOOKS ---------------
  // Effect for Loading Game Assets (Sprites, Backgrounds)
  useEffect(() => {
    const spriteImg = new Image(); spriteImg.src = '/game-assets/robot-sprite.png';
    spriteImg.onload = () => { spriteRef.current = spriteImg; };
    spriteImg.onerror = () => console.error("Failed to load robot sprite.");
    const youDiedImgAsset = new Image(); youDiedImgAsset.src = '/game-assets/you_died.png';
    youDiedImgAsset.onload = () => { youDiedImageRef.current = youDiedImgAsset; };
    youDiedImgAsset.onerror = () => console.error("Failed to load 'You Died' image.");

    const layersDataConfig = [
      { imageName: '1.png', speedMultiplier: 0, isBaseLayer: true }, { imageName: '2.png', speedMultiplier: 0.05 },
      { imageName: '3.png', speedMultiplier: 0.15 }, { imageName: '4.png', speedMultiplier: 0.3 },
      { imageName: '5.png', speedMultiplier: 0.5 },
    ];
    const newLoadedLayers: BackgroundLayer[] = layersDataConfig.map(ld => ({
      image: null, src: `/game-assets/Backgrounds/${currentBackgroundSet}/${gameTheme}/${ld.imageName}`,
      x: 0, speedMultiplier: ld.speedMultiplier, y: 0, width: 0, height: GAME_INTERNAL_HEIGHT,
      isLoaded: false, isBaseLayer: ld.isBaseLayer || false,
    }));
    backgroundLayersRef.current = newLoadedLayers; 
    newLoadedLayers.forEach((layer) => {
      const img = new Image(); layer.isLoaded = false; img.src = layer.src;
      img.onload = () => {
        layer.image = img;
        if (layer.isBaseLayer) { layer.width = GAME_INTERNAL_WIDTH; layer.height = GAME_INTERNAL_HEIGHT; }
        else { layer.width = img.width * (GAME_INTERNAL_HEIGHT / img.height); layer.height = GAME_INTERNAL_HEIGHT; }
        layer.isLoaded = true;
      };
      img.onerror = () => { console.error(`Failed to load background image: ${layer.src}`); layer.isLoaded = false; };
    });
  }, [gameTheme, currentBackgroundSet]); // Reload assets if theme or background set changes

  // Main Setup Effect: Event Listeners, Initial Loop Start, Global Styles
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; 
    const initialCtx = canvas.getContext('2d'); if (initialCtx) initialCtx.imageSmoothingEnabled = false;
    document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
    
    handleResizeCanvas(); 
    window.addEventListener('resize', handleResizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('click', handleCanvasClick);

    if (!animationFrameRef.current) {
        lastFrameTimeRef.current = performance.now();
        if (loopRef.current) animationFrameRef.current = requestAnimationFrame(loopRef.current);
    }

    return () => { // Cleanup
      window.removeEventListener('resize', handleResizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('touchstart', handleTouchStart);
        canvasRef.current.removeEventListener('click', handleCanvasClick);
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null; 
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      isExitingRef.current = false; 
      soundtrackAudioRef.current?.pause();
      document.body.style.overflow = ''; document.documentElement.style.overflow = '';
    };
  }, [onExit, handleKeyDown, handleTouchStart, handleCanvasClick, handleResizeCanvas, loopRef]);

  // Soundtrack Playback Control Effect
  useEffect(() => {
    const audio = soundtrackAudioRef.current;
    if (audio) {
        if (gameStartedRef.current && !gameOver && audioUnlocked) { 
            audio.play().catch(e => console.warn("Soundtrack play failed:", e));
        } else {
            audio.pause();
        }
    }
  }, [gameOver, audioUnlocked, gameStarted]); 

  // --------------- JSX RENDER ---------------
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <div className="jump-game-force-landscape-wrapper">
        <canvas 
            ref={canvasRef} 
            className="jump-game-canvas-styles" 
            width={GAME_INTERNAL_WIDTH} 
            height={GAME_INTERNAL_HEIGHT}
        />
      </div>
      <audio ref={deathAudioRef} src="/game-assets/death_sound.mp3" preload="auto" />
      <audio ref={jumpAudioRef} src="/game-assets/jump.wav" preload="auto" />
      <audio ref={soundtrackAudioRef} src="/game-assets/soundtrack.mp3" loop preload="auto" />
    </div>
  );
};

export default JumpGame;