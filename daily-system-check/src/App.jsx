import React, { useState, useEffect } from 'react';
import CheckForm from './components/CheckForm';
import SuccessScreen from './components/SuccessScreen';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [systems, setSystems] = useState([]);
    const [checkItems, setCheckItems] = useState([]);
    const [prefilledSystem, setPrefilledSystem] = useState(null);

    useEffect(() => {
        // 從 URL Query Parameter 讀取系統名稱 (例如: /?system=ARRMS)
        // 這是 GitHub Pages 的最佳實踐,避免 404 錯誤
        const params = new URLSearchParams(window.location.search);
        const systemFromQuery = params.get('system');

        if (systemFromQuery) {
            setPrefilledSystem(decodeURIComponent(systemFromQuery));
        } else {
            // Fallback: 嘗試從路徑讀取 (保留舊邏輯)
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const systemNameFromUrl = pathParts[pathParts.length - 1];

            if (systemNameFromUrl && systemNameFromUrl !== 'daily-system-check' && !systemNameFromUrl.endsWith('.html')) {
                setPrefilledSystem(decodeURIComponent(systemNameFromUrl));
            }
        }

        const fetchConfig = () => {
            try {
                const callbackName = 'jsonpCallback_' + Date.now();
                const script = document.createElement('script');
                const url = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

                window[callbackName] = (data) => {
                    setSystems(data.systems || []);
                    setCheckItems(data.checkItems || []);
                    setLoading(false);
                    delete window[callbackName];
                    document.body.removeChild(script);
                };

                script.onerror = () => {
                    console.error("Error loading config");
                    alert("無法讀取系統設定，請確認網路連線或稍後再試。");
                    setLoading(false);
                    delete window[callbackName];
                    if (script.parentNode) document.body.removeChild(script);
                };

                script.src = `${url}?callback=${callbackName}`;
                document.body.appendChild(script);

            } catch (error) {
                console.error("Error fetching config:", error);
                alert("無法讀取系統設定，請確認網路連線或稍後再試。");
                setLoading(false);
            }
        };

        fetchConfig();
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
                            <CheckForm
                                key="form"
                                systems={systems}
                                checkItems={checkItems}
                                prefilledSystem={prefilledSystem}
                                onSuccess={() => setSubmitted(true)}
                            />
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

export default App;
