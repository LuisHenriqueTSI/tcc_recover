/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Azul
          dark: '#1e40af',
        },
        secondary: {
          DEFAULT: '#22c55e', // Verde
          dark: '#16a34a',
        },
        accent: {
          DEFAULT: '#f59e42', // Laranja
          dark: '#ea580c',
        },
        neutral: {
          light: '#f3f4f6',
          dark: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

