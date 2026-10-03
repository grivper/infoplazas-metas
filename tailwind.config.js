import tailwindcssAnimate from "tailwindcss-animate";

// CSS variables in index.css hold hex values, so hsl(var(--x)) is invalid CSS.
// color-mix keeps opacity modifiers (e.g. bg-primary/90) working: Tailwind
// replaces <alpha-value> with the modifier (defaults to 1).
const token = (name) =>
  `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          // index.css defines --on-primary, not --primary-foreground
          foreground: token("on-primary"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          // index.css defines --on-secondary, not --secondary-foreground
          foreground: token("on-secondary"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        // Design system "Polished Luminary" tokens defined in index.css
        "surface-container": {
          DEFAULT: token("surface-container"),
          lowest: token("surface-container-lowest"),
          low: token("surface-container-low"),
          high: token("surface-container-high"),
          highest: token("surface-container-highest"),
        },
        // index.css has no --on-surface*; reuse the equivalent shadcn tokens
        "on-surface": {
          DEFAULT: token("foreground"),
          variant: token("muted-foreground"),
        },
        outline: {
          DEFAULT: token("outline"),
          variant: token("outline-variant"),
        },
        tertiary: token("tertiary"),
        error: token("error"),
      },
      // Soft elevation shared by cards and panels (same value as the dashboard cards)
      boxShadow: {
        card: "0 12px 40px rgba(44, 47, 48, 0.06)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
