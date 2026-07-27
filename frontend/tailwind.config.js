/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        cloud: "#f5f7fb",
        "travel-surface": "#f5f7fb",
        amex: "#006fcf",
        mint: "#1f9d7a",
        coral: "#de5b45"
      },
      fontWeight: {
        700: "700",
        800: "800"
      },
      boxShadow: {
        panel: "0 22px 60px rgba(15, 23, 42, 0.16)",
        card: "0 10px 28px rgba(15, 23, 42, 0.08)",
        blue: "0 14px 32px rgba(0, 111, 207, 0.25)"
      }
    }
  },
  plugins: []
};
