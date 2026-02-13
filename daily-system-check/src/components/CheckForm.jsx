import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckItem = ({ id, label, value, onChange }) => {
    const isYes = value === 'Y';
    const isNo = value === 'N';

    const IconButton = ({ active, type, onClick, children }) => {
        const activeClass = type === 'Y'
            ? 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669] -translate-y-[2px]'
            : 'bg-rose-500 text-white shadow-[0_4px_0_0_#be123c] -translate-y-[2px]';

        return (
            <button
                type="button"
                onClick={onClick}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 active:translate-y-0 active:shadow-none ${active ? activeClass : 'bg-gray-50 text-slate-400 hover:bg-gray-100 hover:text-slate-500 border border-gray-200 shadow-sm'
                    }`}
            >
                {active && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </motion.span>
                )}
                <span>{children}</span>
            </button>
        );
    };

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={`group p-5 rounded-[2rem] transition-all duration-300 bg-white border-2 border-transparent hover:border-morandi-primary/20 hover:shadow-xl ${(isYes || isNo) ? 'bg-white shadow-md' : 'bg-white/50'
                }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                    <span className="mt-1 px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 tracking-tighter">
                        {id}
                    </span>
                    <h4 className="text-[15px] font-bold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                        {label}
                    </h4>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <IconButton active={isYes} type="Y" onClick={() => onChange(id, 'Y')}>是</IconButton>
                    <IconButton active={isNo} type="N" onClick={() => onChange(id, 'N')}>否</IconButton>
                </div>
            </div>
        </motion.div>
    );
};

// 「其他」項目使用 checkbox 互動感優化
const OtherItem = ({ id, label, value, onChange }) => {
    const isChecked = value !== null && value !== undefined;

    return (
        <div className="space-y-4">
            <motion.div
                whileHover={{ y: -2 }}
                className={`p-5 rounded-[2rem] bg-white border-2 transition-all duration-300 shadow-sm ${isChecked ? 'border-morandi-primary ring-4 ring-morandi-primary/5' : 'border-transparent hover:border-gray-200'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-400 tracking-tighter">
                            {id}
                        </span>
                        <div>
                            <h4 className="text-[15px] font-bold text-slate-800">{label}</h4>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Optional Protocol</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onChange(id, isChecked ? null : ''); }}
                        className={`relative w-16 h-10 rounded-full transition-all duration-500 overflow-hidden ${isChecked ? 'bg-morandi-primary' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                    >
                        <motion.div
                            initial={false}
                            animate={{ x: isChecked ? 28 : 6 }}
                            className="w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            {isChecked && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <svg className="w-4 h-4 text-morandi-primary" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </motion.div>
                            )}
                        </motion.div>
                    </button>
                </div>

                <AnimatePresence>
                    {isChecked && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="relative">
                                <textarea
                                    placeholder="請詳細輸入說明事項..."
                                    value={value || ''}
                                    onChange={(e) => onChange(id, e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-sm focus:outline-none focus:border-morandi-primary/30 transition-all min-h-[100px] shadow-inner"
                                />
                                <div className="absolute top-4 right-4 animate-pulse">
                                    <span className="inline-block w-2 h-2 rounded-full bg-rose-400"></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
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

    const groupedItems = (checkItems || []).reduce((acc, item) => {
        if (!item || !item.id) return acc;
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

    // 莫蘭迪配色方案系統
    const getGroupTheme = (prefix) => {
        const themes = {
            'ED': {
                border: 'border-blue-200',
                accent: 'bg-blue-400',
                bg: 'bg-blue-50/40',
                shadow: 'shadow-blue-900/5'
            },
            'EM': {
                border: 'border-emerald-200',
                accent: 'bg-emerald-400',
                bg: 'bg-emerald-50/40',
                shadow: 'shadow-emerald-900/5'
            },
            'EY': {
                border: 'border-orange-200',
                accent: 'bg-orange-400',
                bg: 'bg-orange-50/40',
                shadow: 'shadow-orange-900/5'
            },
            'OT': {
                border: 'border-purple-200',
                accent: 'bg-purple-400',
                bg: 'bg-purple-50/40',
                shadow: 'shadow-purple-900/5'
            }
        };
        return themes[prefix] || {
            border: 'border-gray-200',
            accent: 'bg-gray-400',
            bg: 'bg-gray-50/40',
            shadow: 'shadow-gray-900/5'
        };
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-morandi-text tracking-tight mb-2">Daily System Report.</h1>
                <p className="text-morandi-muted text-sm uppercase tracking-[0.2em] font-medium opacity-60">每日系統運行狀態檢核表</p>
                <div className="h-1 w-12 bg-morandi-primary mx-auto mt-4 rounded-full opacity-30"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 系統選擇區塊 - 採更簡約的設計 */}
                {/* --- 基本資訊與身分識別區塊 --- */}
                <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl space-y-8 relative overflow-hidden text-left">
                    {/* 背景微裝飾 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-morandi-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                    <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-slate-900 rounded-xl">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol Specs</h2>
                            <p className="text-lg font-bold text-slate-800">基本資訊識別</p>
                        </div>
                    </div>

                    <div className="space-y-6 text-left">
                        {/* 系統選取 */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-wider flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
                                Target System
                            </label>
                            <select
                                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 text-[15px] font-bold text-slate-700 focus:border-morandi-primary focus:bg-white outline-none transition-all cursor-pointer shadow-inner"
                                value={formData.systemName}
                                onChange={(e) => handleSystemChange(e.target.value)}
                                required
                            >
                                <option value="">請選取欲報告之系統...</option>
                                {systems.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* 責任人資訊卡 */}
                        <AnimatePresence>
                            {formData.systemName && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
                                >
                                    {/* 責任人顯示 */}
                                    <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">👤</div>
                                            <div>
                                                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Owner</p>
                                                <p className="text-md font-bold text-white">{formData.checker}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 身分切換器 (替代原本的 Checkbox) */}
                                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => handleChange('isDeputy', false)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!formData.isDeputy ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 opacity-60'}`}
                                        >
                                            本人報表
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('isDeputy', true)}
                                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.isDeputy ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 opacity-60'}`}
                                        >
                                            代理檢核
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 代理人選單 */}
                        <AnimatePresence>
                            {formData.isDeputy && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-indigo-50/50 p-5 rounded-3xl border-2 border-indigo-100 border-dashed"
                                >
                                    <span className="text-[10px] font-black text-indigo-400 uppercase ml-1 mb-2 block tracking-[0.2em]">Assign Agent Identity</span>
                                    {getDeputyOptions().length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {getDeputyOptions().map(deputy => (
                                                <button
                                                    key={deputy}
                                                    type="button"
                                                    onClick={() => handleChange('deputyName', deputy)}
                                                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${formData.deputyName === deputy
                                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-md'
                                                            : 'bg-white border-transparent text-slate-600 hover:border-indigo-200 shadow-sm'
                                                        }`}
                                                >
                                                    {deputy}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full rounded-2xl border-2 border-indigo-100 bg-white p-4 text-sm font-bold text-slate-700 focus:border-indigo-400 outline-none shadow-sm transition-all"
                                            value={formData.deputyName}
                                            onChange={(e) => handleChange('deputyName', e.target.value)}
                                            placeholder="請輸入代理人姓名..."
                                            required={formData.isDeputy}
                                        />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 分組檢核項目區塊 */}
                <div className="space-y-8 mt-12 relative">
                    {Object.entries(groupedItems).map(([prefix, items], idx) => {
                        const theme = getGroupTheme(prefix);
                        return (
                            <div key={prefix} className={`relative p-5 rounded-[2.5rem] border ${theme.border} ${theme.bg} ${theme.shadow} transition-all duration-500`}>
                                {/* 左側高級感辨識條 */}
                                <div className={`absolute left-0 top-12 bottom-12 w-1 ${theme.accent} rounded-r-full shadow-[0_0_10px_rgba(0,0,0,0.05)]`}></div>

                                <div className="space-y-4">
                                    {items.map(item => {
                                        const isOther = item.id.startsWith('OT');
                                        return isOther ? (
                                            <OtherItem key={item.id} id={item.id} label={item.description} value={formData[item.id]} onChange={handleChange} />
                                        ) : (
                                            <CheckItem key={item.id} id={item.id} label={item.description} value={formData[item.id] || ''} onChange={handleChange} />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-10">
                    <button
                        type="submit"
                        disabled={!isFormValid || submitting}
                        className={`w-full py-5 rounded-3xl text-white font-bold tracking-[0.2em] uppercase transition-all shadow-xl
                        ${isFormValid && !submitting
                                ? 'bg-morandi-text hover:bg-morandi-primary hover:-translate-y-1 active:translate-y-0.5 active:shadow-inner'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                        {submitting ? 'Transmitting Data...' : 'Confirm and Submit'}
                    </button>
                    {!isFormValid && formData.systemName && (
                        <p className="text-center text-[10px] text-morandi-muted font-bold mt-4 tracking-widest uppercase opacity-40 animate-pulse">
                            Please complete all mandatory protocol fields
                        </p>
                    )}
                </div>
            </form>
        </motion.div>
    );
}
