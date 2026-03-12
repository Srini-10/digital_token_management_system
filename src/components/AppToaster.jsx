import { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Drop-in replacement for <Toaster />.
 * Place <AppToaster /> once in your App.jsx instead of <Toaster />.
 *
 * Usage stays the same everywhere:
 *   toast.success('Done!')
 *   toast.error('Failed')
 *   toast('Neutral message')
 */
const AppToaster = () => (
    <Toaster
        position="top-center"
        gutter={10}
        containerStyle={{ top: 20 }}
        toastOptions={{
            // ── Global defaults ───────────────────────
            duration: 3500,
            style: {
                background: '#ffffff',
                color: '#1c1917',
                border: '1px solid #d4ddd0',
                borderRadius: '16px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                maxWidth: '420px',
                lineHeight: '1.4',
            },

            // ── Success ──────────────────────────────
            success: {
                style: {
                    background: '#ffffff',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                },
                iconTheme: {
                    primary: '#059669',
                    secondary: '#ecfdf5',
                },
            },

            // ── Error ────────────────────────────────
            error: {
                style: {
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                },
                iconTheme: {
                    primary: '#dc2626',
                    secondary: '#fef2f2',
                },
            },

            // ── Loading ──────────────────────────────
            loading: {
                style: {
                    background: '#ffffff',
                    border: '1px solid #d4ddd0',
                    color: '#6b6860',
                },
                iconTheme: {
                    primary: '#d4613a',
                    secondary: '#f0ede6',
                },
            },
        }}
    />
);

export default AppToaster;
