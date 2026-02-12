/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                morandi: {
                    bg: '#F5F5F7',
                    card: '#FFFFFF',
                    primary: '#8E9EAB', // Dusty Blue
                    secondary: '#C8C6C6', // Light Grayish
                    accent: '#A7B0A5', // Sage Green
                    text: '#4A4A4A',
                    muted: '#8C8C8C',
                    border: '#E0E0E0'
                }
            }
        },
    },
    plugins: [],
}
