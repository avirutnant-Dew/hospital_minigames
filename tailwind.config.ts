import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Kanit", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        team: {
          alpha: "hsl(var(--team-alpha))",
          beta: "hsl(var(--team-beta))",
          gamma: "hsl(var(--team-gamma))",
          delta: "hsl(var(--team-delta))",
          omega: "hsl(var(--team-omega))",
        },
        strategy: {
          grow: "hsl(var(--grow-plus))",
          safe: "hsl(var(--safe-act))",
          care: "hsl(var(--pro-care))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "dice-roll": {
          "0%": { transform: "rotateX(0deg) rotateY(0deg)" },
          "25%": { transform: "rotateX(90deg) rotateY(90deg)" },
          "50%": { transform: "rotateX(180deg) rotateY(180deg)" },
          "75%": { transform: "rotateX(270deg) rotateY(270deg)" },
          "100%": { transform: "rotateX(360deg) rotateY(360deg)" },
        },
        "ambulance-move": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(var(--move-distance))" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px hsl(var(--accent) / 0.5)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 40px hsl(var(--accent) / 0.8)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "heartbeat": {
          "0%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.15)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.15)" },
          "70%": { transform: "scale(1)" },
        },
        "milestone-burst": {
          "0%": { transform: "scale(0)", opacity: "1" },
          "50%": { opacity: "1" },
          "100%": { transform: "scale(1.2)", opacity: "0" },
        },
        "combo-flash": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.1)" },
        },
        "ticker-pulse": {
          "0%": { color: "hsl(var(--accent))" },
          "50%": { color: "hsl(var(--accent) / 0.6)" },
          "100%": { color: "hsl(var(--accent))" },
        },
        "excited-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "20%": { transform: "translateY(-15px)" },
          "40%": { transform: "translateY(-8px)" },
        },
        "rainbow-glow": {
          "0%": { boxShadow: "0 0 20px hsl(0, 100%, 50%)" },
          "25%": { boxShadow: "0 0 20px hsl(90, 100%, 50%)" },
          "50%": { boxShadow: "0 0 20px hsl(180, 100%, 50%)" },
          "75%": { boxShadow: "0 0 20px hsl(270, 100%, 50%)" },
          "100%": { boxShadow: "0 0 20px hsl(0, 100%, 50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "dice-roll": "dice-roll 1s ease-out",
        "ambulance-move": "ambulance-move 1.5s ease-in-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "fade-out": "fade-out 0.2s ease-out forwards",
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
        "milestone-burst": "milestone-burst 0.6s ease-out",
        "combo-flash": "combo-flash 0.8s ease-in-out infinite",
        "ticker-pulse": "ticker-pulse 1.5s ease-in-out infinite",
        "excited-bounce": "excited-bounce 0.8s ease-out",
        "rainbow-glow": "rainbow-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
