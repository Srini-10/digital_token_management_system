/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'gov-navy': '#1c1917',
                'gov-blue': '#c25a30',
                'gov-gold': '#c49a2c',
                'gov-light': '#f5f2ec',
                'gov-cream': '#f5f2ec',
                'gov-sage': '#d4ddd0',
                'gov-sage-light': '#e8ede5',
                'gov-card': '#ffffff',
                'gov-border': '#d4ddd0',
                'gov-coral': '#d4613a',
                'gov-text': '#1c1917',
                'gov-muted': '#6b6860',
                'gov-subtle': '#9c978f',
                'gov-bg': '#f0ede6',
            },
            fontFamily: {
                'display': ['"DM Serif Display"', 'Georgia', 'serif'],
                'body': ['"DM Sans"', 'system-ui', 'sans-serif'],
            },
            animation: {
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in': 'fadeIn 0.6s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};
