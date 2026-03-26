/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        abyss: "#050816",
        cyanGlow: "#4EE4FF",
        purpleGlow: "#9D7CFF",
        velvet: "#14192C",
      },
      boxShadow: {
        soft: "0 16px 60px rgba(13, 25, 53, 0.28)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(77, 228, 255, 0.16)",
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(78,228,255,0.20), transparent 32%), radial-gradient(circle at top right, rgba(157,124,255,0.18), transparent 28%), linear-gradient(180deg, #060916 0%, #0b1020 42%, #11182c 100%)",
      },
    },
  },
  plugins: [],
};
