import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CheckItem = ({ id, label, value, onChange, isOther, otherNote, onOtherNoteChange }) => {
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
                    {isOther && <span className="text-morandi-muted text-xs ml-2">(非必填)</span>}
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

            {/* 其他項目的說明欄位 */}
            {isOther && (isYes || isNo) && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pl-4"
                >
                    <input
                        type="text"
                        placeholder="請輸入說明..."
                        value={otherNote || ''}
                        onChange={(e) => onOtherNoteChange(id, e.target.value)}
                        className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                    />
                </motion.div>
            )}
        </div>
    );
};

export default function CheckForm({ systems, checkItems, prefilledSystem, onSuccess }) {
    const [formData, setFormData] = useState({
        systemName: '',
        checker: '',
        isDeputy: false,
        deputyName: ''
    });

    const [selectedSystem, setSelectedSystem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [todayStatus, setTodayStatus] = useState(null); // { completed: boolean, checker: string }
    const [checkingStatus, setCheckingStatus] = useState(false);

    // 當選擇系統時,自動帶入負責人並檢查今日狀態
    useEffect(() => {
        if (formData.systemName) {
            const system = systems.find(s => s.name === formData.systemName);
            if (system) {
                setSelectedSystem(system);
                setFormData(prev => ({
                    ...prev,
                    checker: system.owner
                }));

                // 檢查今日是否已完成
                checkTodayStatus(formData.systemName);
            }
        }
    }, [formData.systemName, systems]);

    // 從 URL 預填系統名稱
    useEffect(() => {
        if (prefilledSystem && systems.length > 0) {
            const system = systems.find(s => s.name === prefilledSystem);
            if (system) {
                setFormData(prev => ({
                    ...prev,
                    systemName: system.name
                }));
            }
        }
    }, [prefilledSystem, systems]);

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
    const checkTodayStatus = async (systemName) => {
        setCheckingStatus(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL}?action=checkToday&system=${encodeURIComponent(systemName)}`
            );
            const data = await response.json();
            setTodayStatus(data);
        } catch (error) {
            console.error('檢查今日狀態失敗:', error);
            setTodayStatus(null);
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleOtherNoteChange = (id, note) => {
        setFormData(prev => ({ ...prev, [`${id}_note`]: note }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        console.log('=== 開始提交表單 ===');
        console.log('表單資料:', formData);
        console.log('提交 URL:', import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL);

        try {
            const response = await fetch(import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { "Content-Type": "text/plain" }
            });

            console.log('回應狀態:', response.status);
            const responseText = await response.text();
            console.log('回應內容:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            onSuccess();
        } catch (err) {
            console.error("提交錯誤:", err);
            alert("提交失敗，請檢查網路連線。錯誤: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // 檢查所有必填檢核項目是否都已填寫 (其他項目除外)
    const allItemsFilled = checkItems.every(item => {
        const isOther = item.id === 'OT01' || item.description.includes('其他');
        return isOther || formData[item.id];
    });
    const isFormValid = formData.systemName && formData.checker && allItemsFilled;

    // 獲取代理人選項
    const getDeputyOptions = () => {
        if (!selectedSystem) return [];
        const options = [];
        if (selectedSystem.deputy) options.push(selectedSystem.deputy);
        if (selectedSystem.generalDeputy) options.push(selectedSystem.generalDeputy);
        return [...new Set(options)]; // 去重
    };

    // 如果今日已完成,顯示提示
    if (todayStatus?.completed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
            >
                <div className="text-6xl">✅</div>
                <h2 className="text-2xl font-bold text-green-600">今日已完成檢核</h2>
                <p className="text-morandi-text">
                    檢核人：<span className="font-bold text-morandi-primary">{todayStatus.checker}</span>
                </p>
                <p className="text-morandi-muted text-sm">
                    系統：{formData.systemName}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-morandi-primary text-white rounded-lg hover:bg-slate-500 transition-all"
                >
                    重新整理
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-morandi-text">每日系統檢核回報</h1>
                <p className="text-morandi-muted text-sm mt-1">請確實填寫下列檢核項目</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-morandi-text mb-1">系統名稱</label>
                        <select
                            className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                            value={formData.systemName}
                            onChange={(e) => handleChange('systemName', e.target.value)}
                            required
                        >
                            <option value="">請選擇系統...</option>
                            {systems.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-morandi-text mb-1">負責人</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-morandi-border bg-gray-100 p-2.5 text-sm outline-none cursor-not-allowed"
                                value={formData.checker}
                                readOnly
                                disabled
                            />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 mt-8">
                                <input
                                    type="checkbox"
                                    id="isDeputy"
                                    checked={formData.isDeputy}
                                    onChange={(e) => handleChange('isDeputy', e.target.checked)}
                                    className="rounded text-morandi-primary focus:ring-morandi-primary"
                                />
                                <label htmlFor="isDeputy" className="text-sm text-morandi-text select-none">此為代理人檢核</label>
                            </div>
                        </div>
                    </div>

                    {formData.isDeputy && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            overflow="hidden"
                        >
                            <label className="block text-sm font-medium text-morandi-text mb-1">代理人</label>
                            {getDeputyOptions().length > 0 ? (
                                <select
                                    className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                                    value={formData.deputyName}
                                    onChange={(e) => handleChange('deputyName', e.target.value)}
                                    required={formData.isDeputy}
                                >
                                    <option value="">請選擇代理人...</option>
                                    {getDeputyOptions().map(deputy => (
                                        <option key={deputy} value={deputy}>{deputy}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                                    value={formData.deputyName}
                                    onChange={(e) => handleChange('deputyName', e.target.value)}
                                    placeholder="請輸入代理人姓名"
                                    required={formData.isDeputy}
                                />
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Checklist - 不顯示分組標題 */}
                <div className="bg-white p-4 rounded-xl border border-morandi-border space-y-3">
                    {checkItems.map(item => {
                        const isOther = item.id === 'OT01' || item.description.includes('其他');
                        return (
                            <CheckItem
                                key={item.id}
                                id={item.id}
                                label={item.description}
                                value={formData[item.id] || ''}
                                onChange={handleChange}
                                isOther={isOther}
                                otherNote={formData[`${item.id}_note`]}
                                onOtherNoteChange={handleOtherNoteChange}
                            />
                        );
                    })}
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className={`w-full py-3 rounded-lg text-white font-bold tracking-wide transition-all shadow-lg
            ${isFormValid && !submitting
                            ? 'bg-morandi-primary hover:bg-slate-500 hover:scale-[1.02]'
                            : 'bg-gray-300 cursor-not-allowed'}`}
                >
                    {submitting ? '提交中...' : '送出檢核回報'}
                </button>
            </form>
        </motion.div>
    );
}
