// tailwind.config.js
// Configuration file for Tailwind CSS (Updated for Pastels & Single View)

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Define a pastel color palette
        'pastel-pink': '#fecdd3', // rose-200
        'pastel-blue': '#bfdbfe', // blue-200
        'pastel-green': '#bbf7d0', // green-200
        'pastel-purple': '#e9d5ff', // purple-200
        'pastel-yellow': '#fef08a', // yellow-200

        'text-main-light': '#4b5563', // gray-600
        'text-main-dark': '#d1d5db', // gray-300
        'text-muted-light': '#6b7280', // gray-500
        'text-muted-dark': '#9ca3af', // gray-400

        'bg-light': '#fdfdff', // Near white with a hint of blue/purple
        'bg-dark': '#2c3e50', // Dark slate/blue

        'card-light': '#ffffff',
        'card-dark': '#34495e', // Slightly lighter dark slate

        'icon-bg-light': 'rgba(191, 219, 254, 0.3)', // pastel-blue with alpha
        'icon-bg-dark': 'rgba(233, 213, 255, 0.2)', // pastel-purple with alpha

        'button-light': '#a5b4fc', // indigo-300
        'button-hover-light': '#818cf8', // indigo-400
        'button-dark': '#c7d2fe', // indigo-200
        'button-hover-dark': '#a5b4fc', // indigo-300
        'button-text': '#1e1b4b', // indigo-950

        'blossom': '#fbcfe8', // pink-200 - Pastel blossom
      },
		fontFamily: {
		  sans: ['"Segoe UI Emoji"', '"Apple Color Emoji"', '"Noto Color Emoji"', 'sans-serif'],
		},
      keyframes: {
        'blossom-fall-combined': { // Keep the working animation
          '0%': { transform: 'translateY(-10%) translateX(0px)', opacity: '1' },
          '25%': { transform: 'translateY(25vh) translateX(5px)' },
          '50%': { transform: 'translateY(55vh) translateX(-5px)' },
          '75%': { transform: 'translateY(85vh) translateX(5px)' },
          '100%': { transform: 'translateY(110vh) translateX(0px)', opacity: '0' },
        },
      },
      animation: {
        'blossom-fall': 'blossom-fall-combined var(--duration) linear infinite', // Renamed for clarity
      },
       textShadow: {
        DEFAULT: '0 1px 2px rgba(0, 0, 0, 0.1)',
        md: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
     function ({ addUtilities, theme, e }) {
      const utilities = Object.entries(theme('textShadow')).map(([key, value]) => ({
        [`.${e(`text-shadow${key === 'DEFAULT' ? '' : `-${key}`}`)}`]: {
          textShadow: value,
        },
      }));
      addUtilities(utilities);
    },
  ],
}
