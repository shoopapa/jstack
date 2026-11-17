import type { Config } from "tailwindcss";
import fontFamily from "tailwindcss/defaultTheme";

import baseConfig from "@jstack/tailwind-config/web";

export default {
  // Include the UI package so its classes are generated.
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.fontFamily.mono],
      },
    },
  },
} satisfies Config;
