/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Institutional case-file palette
        base:   "#0A101C",   // deep navy-charcoal
        panel:  "#101827",   // raised surface
        panel2: "#16202F",   // higher surface
        line:   "#22304A",   // hairline borders
        ink:    "#E8EDF5",   // primary text
        muted:  "#8FA0B8",   // secondary text
        signal: "#C7A54A",   // badge gold — sole accent
        steel:  "#5B84B1",   // informational blue (links, meta)
        // risk spectrum, desaturated cold -> hot
        safe:   "#2E9E7A",
        low:    "#7BAE4F",
        mod:    "#D9A83C",
        high:   "#D9722F",
        crit:   "#DC5252",
      },
      fontFamily: {
        display: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      boxShadow: {
        glass: "0 8px 40px -12px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(199,165,74,0.25), 0 0 24px -6px rgba(199,165,74,0.2)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(34,48,74,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(34,48,74,0.35) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
