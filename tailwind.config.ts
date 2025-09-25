import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Override all colors to use our 4-color palette
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        // Override all default Tailwind colors to use our palette
        gray: {
          50: 'hsl(var(--white))',
          100: 'hsl(var(--white))',
          200: 'hsl(var(--black-soft))',
          300: 'hsl(var(--black-soft))',
          400: 'hsl(var(--black-soft))',
          500: 'hsl(var(--black-soft))',
          600: 'hsl(var(--black))',
          700: 'hsl(var(--black))',
          800: 'hsl(var(--black))',
          900: 'hsl(var(--black))',
        },
        green: {
          50: 'hsl(var(--white))',
          100: 'hsl(var(--white))',
          200: 'hsl(var(--green))',
          300: 'hsl(var(--green))',
          400: 'hsl(var(--green))',
          500: 'hsl(var(--green))',
          600: 'hsl(var(--green))',
          700: 'hsl(var(--green))',
          800: 'hsl(var(--green))',
          900: 'hsl(var(--green))',
        },
        // Override old color names
        'cal-poly-green': {
          50: 'hsl(var(--white))',
          100: 'hsl(var(--white))',
          200: 'hsl(var(--green))',
          300: 'hsl(var(--green))',
          400: 'hsl(var(--green))',
          500: 'hsl(var(--green))',
          600: 'hsl(var(--green))',
          700: 'hsl(var(--green))',
          800: 'hsl(var(--green))',
          900: 'hsl(var(--green))',
        },
        khaki: {
          50: 'hsl(var(--white))',
          100: 'hsl(var(--white))',
          200: 'hsl(var(--black-soft))',
          300: 'hsl(var(--black-soft))',
          400: 'hsl(var(--black-soft))',
          500: 'hsl(var(--black-soft))',
          600: 'hsl(var(--black))',
          700: 'hsl(var(--black))',
          800: 'hsl(var(--black))',
          900: 'hsl(var(--black))',
        },
        'smoky-black': {
          50: 'hsl(var(--white))',
          100: 'hsl(var(--white))',
          200: 'hsl(var(--black-soft))',
          300: 'hsl(var(--black-soft))',
          400: 'hsl(var(--black-soft))',
          500: 'hsl(var(--black))',
          600: 'hsl(var(--black))',
          700: 'hsl(var(--black))',
          800: 'hsl(var(--black))',
          900: 'hsl(var(--black))',
        },
      },
    },
  },
  plugins: [],
};

export default config; 