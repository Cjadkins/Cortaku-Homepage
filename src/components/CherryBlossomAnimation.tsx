// src/components/CherryBlossomAnimation.tsx
'use client'; // This component uses client-side effects

import React, { useEffect, useState } from 'react';

const CherryBlossomAnimation = () => {
  const [blossoms, setBlossoms] = useState<React.ReactNode[]>([]);
  const numBlossoms = 20; // Adjust number of blossoms

  useEffect(() => {
    const generatedBlossoms = [];
    for (let i = 0; i < numBlossoms; i++) {
      // Define CSS variables for random properties
      const style = {
        '--left': `${Math.random() * 100}vw`, // Random horizontal start position
        '--delay': `${Math.random() * 10}s`, // Random start delay (0-10s)
        '--duration': `${6 + Math.random() * 6}s`, // Random fall duration (6-12s)
      } as React.CSSProperties;

      // No movement classes needed with the combined keyframe
      generatedBlossoms.push(
        <div key={i} className={`blossom`} style={style}></div>
      );
    }
    setBlossoms(generatedBlossoms);
  }, []); // Run only once on mount

  // Render the container holding all blossom elements
  return <div className="blossom-container">{blossoms}</div>;
};

export default CherryBlossomAnimation;
