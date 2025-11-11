/** Tailwind CSS configuration for Next.js App Router.
 *  - Scans TS/TSX files in app/, pages/, and components/ for class names
 */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};



