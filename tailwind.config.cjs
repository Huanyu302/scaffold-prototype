/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          formative: {
            primary: "#00A3C4",
            light: "rgba(0, 163, 196, 0.15)",
            border: "rgba(0, 163, 196, 0.3)",
          },
          summative: {
            primary: "#1A73E8",
            light: "rgba(26, 115, 232, 0.12)",
            border: "rgba(26, 115, 232, 0.3)",
          },
        },
        glass: {
          bg: "rgba(255, 255, 255, 0.7)",
          bgDark: "rgba(15, 23, 42, 0.6)",
          border: "rgba(255, 255, 255, 0.4)",
          borderDark: "rgba(255, 255, 255, 0.1)",
        }
      },
      fontFamily: {
        heading: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', 'sans-serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', 'sans-serif'],
        roboto: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', 'sans-serif'],
        sfpro: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"', 'sans-serif'],
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
