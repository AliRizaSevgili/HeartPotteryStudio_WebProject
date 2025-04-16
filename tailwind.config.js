/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{hbs,html}",
    "./public/**/*.js",
    "./public/**/*.html",
    "./index.html",
    "./node_modules/flowbite/**/*.js"
  ],

  safelist: [
    'area',
    'circles',
    'circles li',
    'animate',
    'animate-slide-in'
  ],
  
  
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // used in form: shadow-xs
      },
      aspectRatio: {
        '1155/678': '1155 / 678', // used in blur background
      },
      lineHeight: {
        6: '1.5rem',  // used in text-sm/6
        8: '2rem',    // used in text-lg/8
      },


      keyframes: {
        slidein: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },

        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slidein 1s ease-out forwards',
        'slideUp': 'slideUp 0.6s ease-out forwards',
      },
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
};


