/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        cloud: "#f5f7fb",
        amex: "#006fcf",
        mint: "#1f9d7a",
        coral: "#de5b45"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(23, 32, 51, 0.10)"
      }
    }
  },
  plugins: []
};
