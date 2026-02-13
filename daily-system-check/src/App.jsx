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
    const [todayStatus, setTodayStatus] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const systemFromQuery = params.get('system');
        let currentPrefilled = null;

        if (systemFromQuery) {
            currentPrefilled = decodeURIComponent(systemFromQuery);
        } else {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const systemNameFromUrl = pathParts[pathParts.length - 1];
            if (systemNameFromUrl && systemNameFromUrl !== 'daily-system-check' && !systemNameFromUrl.endsWith('.html')) {
                currentPrefilled = decodeURIComponent(systemNameFromUrl);
            }
        }
        setPrefilledSystem(currentPrefilled);

        const fetchAllInitialData = async () => {
            try {
                // 1. 獲取基本配置 (系統列表, 檢查項目)
                const config = await new Promise((resolve, reject) => {
                    const callbackName = 'jsonpCallback_' + Date.now();
                    const script = document.createElement('script');
                    const url = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

                    window[callbackName] = (data) => {
                        delete window[callbackName];
                        document.body.removeChild(script);
                        resolve(data);
                    };

                    script.onerror = () => {
                        delete window[callbackName];
                        if (script.parentNode) document.body.removeChild(script);
                        reject(new Error("Config load failed"));
                    };

                    script.src = `${url}?callback=${callbackName}`;
                    document.body.appendChild(script);
                });

                setSystems(config.systems || []);
                setCheckItems(config.checkItems || []);

                // 2. 如果有預填系統, 接著檢查今日狀態
                if (currentPrefilled) {
                    const status = await new Promise((resolve) => {
                        const callbackName = 'checkTodayCallback_' + Date.now();
                        const script = document.createElement('script');
                        const url = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

                        window[callbackName] = (data) => {
                            delete window[callbackName];
                            document.body.removeChild(script);
                            resolve(data);
                        };

                        script.onerror = () => {
                            delete window[callbackName];
                            if (script.parentNode) document.body.removeChild(script);
                            resolve(null);
                        };

                        script.src = `${url}?action=checkToday&system=${encodeURIComponent(currentPrefilled)}&callback=${callbackName}`;
                        document.body.appendChild(script);
                    });
                    setTodayStatus(status);
                }

                setLoading(false);
            } catch (error) {
                console.error("Initialization error:", error);
                alert("無法讀取系統設定，請檢查網路連線。");
                setLoading(false);
            }
        };

        fetchAllInitialData();
    }, []);

    return (
        <div className="min-h-screen p-4 flex items-center justify-center bg-morandi-bg">
            <div className="w-full max-w-2xl bg-morandi-card rounded-2xl shadow-xl overflow-hidden p-8 border border-morandi-border">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-morandi-primary"></div>
                        <p className="text-morandi-muted text-sm animate-pulse font-medium">系統初始化中...</p>
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
                                initialTodayStatus={todayStatus}
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
