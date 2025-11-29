import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        sidebar: "#000000",
        surface: "#181818",
        surfaceHover: "#282828",
        primary: "#1DB954",
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
        }
      },
    },
  },
  plugins: [],
};
export default config;