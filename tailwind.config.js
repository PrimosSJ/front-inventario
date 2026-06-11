/** @type {import('tailwindcss').Config} */

import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    daisyui
  ],
  // DaisyUI configuration block
  daisyui: {
    themes: [
      {
        "dark": {
          "primary": "#A259FF",
          "primary-content": "#FFFFFF",
          "secondary": "#0C8CE9",
          "accent": "#F24E1E",
          "neutral": "#2C2C2C",
          "neutral-content": "#E3E3E3",
          "base-100": "#1E1E1E",
          "base-200": "#2C2C2C",
          "base-300": "#121212",
          "base-content": "#E3E3E3",
          "info": "#0C8CE9",
          "success": "#14AE5C",
          "warning": "#FFC700",
          "error": "#F24E1E",

          "--rounded-btn": "0.25rem",
          "--rounded-box": "0.375rem",
        },
      },
    ],
  }
}