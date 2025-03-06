module.exports = {
  content: [
    "./views/**/*.hbs",
    "./public/**/*.js",
    "./public/**/*.html",
    "./index.html",
  ],
  corePlugins: {
    preflight: false, 
  },
  theme: {
    extend: {fontFamily: {
      sans: ['ui-sans-serif', '-apple-system', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
    },},
  },
  plugins: [],
};
