// src/components/CherryBlossomAnimation.tsx
'use client'; // This component uses client-side effects

import React, { useEffect, useState } from 'react';

const CherryBlossomAnimation = () => {
  if (typeof window !== 'undefined' && (window as any).disableBlossoms) {
    return null;
  }

  const [blossoms, setBlossoms] = useState<React.ReactNode[]>([]);
  const numBlossoms = 20; // Adjust number of blossoms

  useEffect(() => {
    const generatedBlossoms = [];
    for (let i = 0; i < numBlossoms; i++) {
      const style = {
        '--left': `${Math.random() * 100}vw`,
        '--delay': `${Math.random() * 10}s`,
        '--duration': `${6 + Math.random() * 6}s`,
      } as React.CSSProperties;

      generatedBlossoms.push(
        <div key={i} className={`blossom`} style={style}></div>
      );
    }
    setBlossoms(generatedBlossoms);
  }, []);

  return <div className="blossom-container">{blossoms}</div>;
};

export default CherryBlossomAnimation;