/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"] ,
  theme: {
    extend: {
      colors: {
        primary: "hsl(252 85% 60%)",
        accent: "hsl(210 90% 55%)",
      },
      boxShadow: {
        glow: "0 0 25px rgba(108, 99, 255, 0.45)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(108, 99, 255, 0.0)" },
          "50%": { boxShadow: "0 0 30px rgba(108, 99, 255, 0.6)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
