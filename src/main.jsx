import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e40af',
                            color: '#fff',
                            borderRadius: '10px',
                            fontSize: '14px',
                        },
                        success: { style: { background: '#16a34a' } },
                        error: { style: { background: '#dc2626' } },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
