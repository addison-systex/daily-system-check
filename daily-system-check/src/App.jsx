import React, { useState, useEffect } from 'react';
import CheckForm from './components/CheckForm';
import SuccessScreen from './components/SuccessScreen';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [systems, setSystems] = useState([]);

    useEffect(() => {
        const fetchSystems = async () => {
            try {
                const response = await fetch(import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setSystems(data);
            } catch (error) {
                console.error("Error fetching systems:", error);
                // Fallback or alert user
                alert("無法讀取系統清單，請確認網路連線或稍後再試。");
            } finally {
                setLoading(false);
            }
        };

        fetchSystems();
    }, []);

    return (
        <div className="min-h-screen p-4 flex items-center justify-center bg-morandi-bg">
            <div className="w-full max-w-2xl bg-morandi-card rounded-2xl shadow-xl overflow-hidden p-8 border border-morandi-border">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-morandi-primary"></div>
                    </div>
                ) : (
                    <AnimatePresence mode='wait'>
                        {submitted ? (
                            <SuccessScreen key="success" onReset={() => setSubmitted(false)} />
                        ) : (
                            <CheckForm key="form" systems={systems} onSuccess={() => setSubmitted(true)} />
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

export default App;
