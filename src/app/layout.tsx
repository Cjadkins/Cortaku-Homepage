// src/app/layout.tsx

import type { Metadata } from 'next';
import { Providers } from './providers'; // Theme provider
import CherryBlossomAnimation from '../components/CherryBlossomAnimation'; // *** RESTORED Import ***
import './globals.css'; // Global styles

// Define site metadata
export const metadata: Metadata = {
  title: 'Cortaku - App Hub', // Updated title
  description: 'Cortaku\'s self-hosted application hub.', // Updated description
  // icons: { icon: '/favicon.ico' }, // Optional: Add favicon link
};

// Define the RootLayout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Apply Inter font class to html tag
    <html lang="en">
      <head />
      <body>
        {/* Wrap content with Providers for theme handling */}
        <Providers>
          {/* Add the blossom animation component *** RESTORED *** */}
          <CherryBlossomAnimation />
          {/* Render the page content */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
