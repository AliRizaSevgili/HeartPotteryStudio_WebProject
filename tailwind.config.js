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
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
};
