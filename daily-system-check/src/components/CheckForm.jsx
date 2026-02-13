import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CheckItem = ({ id, label, value, onChange }) => {
    const isYes = value === 'Y';
    const isNo = value === 'N';

    return (
        <div className="space-y-2">
            <div
                className={`flex items-center justify-between py-4 px-4 rounded-lg transition-all duration-300 cursor-pointer ${isYes ? 'bg-green-50 border-2 border-green-400' :
                    isNo ? 'bg-red-50 border-2 border-red-400' :
                        'bg-white border border-morandi-border hover:bg-gray-50 hover:border-morandi-primary'
                    }`}
            >
                <label className="text-morandi-text text-sm font-medium flex-1 cursor-pointer">
                    <span className="text-morandi-primary font-bold mr-2">{id}</span>
                    {label}
                </label>
                <div className="flex space-x-3">
                    <label
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${isYes ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 hover:bg-green-100'
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(id, 'Y');
                        }}
                    >
                        <input
                            type="radio"
                            name={id}
                            value="Y"
                            checked={isYes}
                            onChange={() => onChange(id, 'Y')}
                            className="form-radio text-green-500 focus:ring-green-500 h-4 w-4"
                        />
                        <span className="text-sm font-medium">是</span>
                    </label>
                    <label
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${isNo ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 hover:bg-red-100'
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(id, 'N');
                        }}
                    >
                        <input
                            type="radio"
                            name={id}
                            value="N"
                            checked={isNo}
                            onChange={() => onChange(id, 'N')}
                            className="form-radio text-red-500 focus:ring-red-500 h-4 w-4"
                        />
                        <span className="text-sm font-medium">否</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

// 「其他」項目使用 checkbox
const OtherItem = ({ id, label, value, onChange }) => {
    const isChecked = value !== null && value !== undefined;

    return (
        <div className="space-y-2">
            <div
                className={`flex items-center justify-between py-4 px-4 rounded-lg transition-all duration-300 ${isChecked ? 'bg-morandi-primary/10 border-2 border-morandi-primary' :
                    'bg-white border border-morandi-border hover:bg-gray-50 hover:border-morandi-primary'
                    }`}
            >
                <label className="text-morandi-text text-sm font-medium flex-1 cursor-pointer">
                    <span className="text-morandi-primary font-bold mr-2">{id}</span>
                    {label}
                    <span className="text-morandi-muted text-xs ml-2">(選填)</span>
                </label>
                <label
                    className={`flex items-center space-x-2 px-5 py-2 rounded-lg cursor-pointer transition-all ${isChecked ? 'bg-morandi-primary text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    onClick={(e) => {
                        e.preventDefault();
                        onChange(id, isChecked ? null : '');
                    }}
                >
                    <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="form-checkbox text-white border-white focus:ring-white h-4 w-4 rounded"
                    />
                    <span className="text-sm font-bold">是</span>
                </label>
            </div>

            {/* 勾選後顯示說明欄位 (必填) */}
            {isChecked && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pl-4"
                >
                    <div className="flex items-center space-x-2">
                        <div className="w-1 h-8 bg-morandi-primary rounded-full"></div>
                        <input
                            type="text"
                            placeholder="請輸入說明 (必填)..."
                            value={value || ''}
                            onChange={(e) => onChange(id, e.target.value)}
                            required
                            className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none border-l-0 rounded-l-none"
                        />
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default function CheckForm({ systems, checkItems, prefilledSystem, initialTodayStatus, onSuccess }) {
    const [formData, setFormData] = useState({
        systemName: '',
        checker: '',
        isDeputy: false,
        deputyName: ''
    });

    const [selectedSystem, setSelectedSystem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [todayStatus, setTodayStatus] = useState(initialTodayStatus || null);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // 從 URL 預填系統名稱 (僅在組件首掛載時執行)
    useEffect(() => {
        if (prefilledSystem && systems.length > 0) {
            const system = systems.find(s => s.name === prefilledSystem);
            if (system) {
                setFormData(prev => ({
                    ...prev,
                    systemName: system.name,
                    checker: system.owner
                }));
                setSelectedSystem(system);
            }
        }
    }, [prefilledSystem, systems]);

    // 處理手動選擇系統
    const handleSystemChange = (systemName) => {
        const system = systems.find(s => s.name === systemName);
        if (system) {
            setSelectedSystem(system);
            setFormData(prev => ({
                ...prev,
                systemName: system.name,
                checker: system.owner
            }));

            // 只有手動切換且不是預填時, 才在組件內觸發 loading
            checkTodayStatus(systemName);
        } else {
            setFormData(prev => ({ ...prev, systemName: '', checker: '' }));
            setSelectedSystem(null);
            setTodayStatus(null);
        }
    };

    // 當勾選代理人時,自動帶入代理人
    useEffect(() => {
        if (formData.isDeputy && selectedSystem) {
            setFormData(prev => ({
                ...prev,
                deputyName: selectedSystem.deputy || selectedSystem.generalDeputy || ''
            }));
        } else if (!formData.isDeputy) {
            setFormData(prev => ({
                ...prev,
                deputyName: ''
            }));
        }
    }, [formData.isDeputy, selectedSystem]);

    // 檢查今日是否已完成
    const checkTodayStatus = (systemName) => {
        setCheckingStatus(true);
        const callbackName = 'checkTodayCallback_' + Date.now();
        const script = document.createElement('script');
        const url = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

        window[callbackName] = (data) => {
            setTodayStatus(data);
            setCheckingStatus(false);
            delete window[callbackName];
            document.body.removeChild(script);
        };

        script.onerror = () => {
            setTodayStatus(null);
            setCheckingStatus(false);
            delete window[callbackName];
            if (script.parentNode) document.body.removeChild(script);
        };

        script.src = `${url}?action=checkToday&system=${encodeURIComponent(systemName)}&callback=${callbackName}`;
        document.body.appendChild(script);
    };

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { "Content-Type": "text/plain" }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            onSuccess();
        } catch (err) {
            console.error("提交錯誤:", err);
            alert("提交失敗，請檢查網路連線。");
        } finally {
            setSubmitting(false);
        }
    };

    // 檢查表單有效性
    const isFormValid = formData.systemName && formData.checker && checkItems.every(item => {
        const isOther = item.id.startsWith('OT');
        const val = formData[item.id];
        if (isOther) {
            if (val !== null && val !== undefined) return val.trim().length > 0;
            return true;
        }
        return val === 'Y' || val === 'N';
    });

    const groupedItems = checkItems.reduce((acc, item) => {
        const prefix = item.id.substring(0, 2);
        if (!acc[prefix]) acc[prefix] = [];
        acc[prefix].push(item);
        return acc;
    }, {});

    const getDeputyOptions = () => {
        if (!selectedSystem) return [];
        const options = [];
        if (selectedSystem.deputy) options.push(selectedSystem.deputy);
        if (selectedSystem.generalDeputy) options.push(selectedSystem.generalDeputy);
        return [...new Set(options)];
    };

    if (checkingStatus) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-morandi-primary"></div>
                <p className="text-morandi-muted text-sm animate-pulse font-medium">更新檢核能量中...</p>
            </div>
        );
    }

    if (todayStatus?.completed) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4 bg-white rounded-2xl border border-morandi-border shadow-sm">
                <div className="text-6xl mb-2">✅</div>
                <h2 className="text-2xl font-bold text-morandi-text">今日檢核已完成</h2>
                <div className="bg-gray-50 p-4 rounded-xl inline-block text-left border border-gray-100">
                    <p className="text-morandi-text">系統：<span className="font-bold">{formData.systemName}</span></p>
                    <p className="text-morandi-text">檢核人：<span className="font-bold">{todayStatus.checker}</span></p>
                </div>
                <div className="pt-4">
                    <button onClick={() => window.location.reload()} className="px-8 py-2.5 bg-morandi-primary text-white rounded-full font-bold hover:bg-slate-500 transition-all shadow-md">
                        重新整理
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-morandi-text tracking-tight">每日系統檢核回報</h1>
                <div className="h-1 w-12 bg-morandi-primary mx-auto mt-2 rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-morandi-primary uppercase tracking-wider mb-2">系統選擇</label>
                        <select
                            className="w-full rounded-xl border-morandi-border bg-white p-3 text-sm focus:ring-2 focus:ring-morandi-primary outline-none shadow-sm"
                            value={formData.systemName}
                            onChange={(e) => handleSystemChange(e.target.value)}
                            required
                        >
                            <option value="">請選擇欲檢核的系統...</option>
                            {systems.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-morandi-primary uppercase tracking-wider mb-2">主要負責人</label>
                            <input
                                type="text"
                                className="w-full rounded-xl border-morandi-border bg-gray-100 p-3 text-sm outline-none cursor-not-allowed opacity-70"
                                value={formData.checker}
                                readOnly
                                disabled
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-all">
                                <input
                                    type="checkbox"
                                    checked={formData.isDeputy}
                                    onChange={(e) => handleChange('isDeputy', e.target.checked)}
                                    className="w-5 h-5 rounded border-morandi-border text-morandi-primary focus:ring-morandi-primary"
                                />
                                <span className="text-sm font-medium text-morandi-text">由代理人檢核</span>
                            </label>
                        </div>
                    </div>

                    {formData.isDeputy && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                            <label className="block text-xs font-bold text-morandi-primary uppercase tracking-wider mb-2">代理人姓名</label>
                            {getDeputyOptions().length > 0 ? (
                                <select
                                    className="w-full rounded-xl border-morandi-border bg-white p-3 text-sm focus:ring-2 focus:ring-morandi-primary outline-none shadow-sm"
                                    value={formData.deputyName}
                                    onChange={(e) => handleChange('deputyName', e.target.value)}
                                    required={formData.isDeputy}
                                >
                                    <option value="">請選擇人員...</option>
                                    {getDeputyOptions().map(deputy => <option key={deputy} value={deputy}>{deputy}</option>)}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full rounded-xl border-morandi-border bg-white p-3 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                                    value={formData.deputyName}
                                    onChange={(e) => handleChange('deputyName', e.target.value)}
                                    placeholder="請輸入代理人姓名"
                                    required={formData.isDeputy}
                                />
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="space-y-5">
                    {Object.values(groupedItems).map((items, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-morandi-border shadow-sm space-y-4">
                            {items.map(item => {
                                const isOther = item.id.startsWith('OT');
                                return isOther ? (
                                    <OtherItem key={item.id} id={item.id} label={item.description} value={formData[item.id]} onChange={handleChange} />
                                ) : (
                                    <CheckItem key={item.id} id={item.id} label={item.description} value={formData[item.id] || ''} onChange={handleChange} />
                                );
                            })}
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className={`w-full py-4 rounded-xl text-white font-bold tracking-widest transition-all shadow-lg
                    ${isFormValid && !submitting ? 'bg-morandi-primary hover:bg-slate-600 hover:-translate-y-0.5 active:translate-y-0' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                    {submitting ? '資料上傳中...' : '送出今日回報'}
                </button>
            </form>
        </motion.div>
    );
}
