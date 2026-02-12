import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CheckItem = ({ id, label, value, onChange }) => {
    const isYes = value === 'Y';
    const isNo = value === 'N';

    return (
        <div className={`flex items-center justify-between py-3 px-4 rounded-lg transition-all duration-300 ${isYes ? 'bg-green-50 border-2 border-green-400' :
            isNo ? 'bg-red-50 border-2 border-red-400' :
                'bg-white border border-morandi-border hover:bg-gray-50'
            }`}>
            <label className="text-morandi-text text-sm font-medium flex-1 cursor-pointer" htmlFor={id}>
                <span className="text-morandi-primary font-bold mr-2">{id}</span>
                {label}
            </label>
            <div className="flex space-x-4">
                <label className="flex items-center space-x-1 cursor-pointer">
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
                <label className="flex items-center space-x-1 cursor-pointer">
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
    );
};

export default function CheckForm({ systems, checkItems, onSuccess }) {
    const [formData, setFormData] = useState({
        systemName: '',
        checker: '',
        isDeputy: false,
        deputyName: ''
    });

    const [selectedSystem, setSelectedSystem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // 當選擇系統時,自動帶入負責人
    useEffect(() => {
        if (formData.systemName) {
            const system = systems.find(s => s.name === formData.systemName);
            if (system) {
                setSelectedSystem(system);
                setFormData(prev => ({
                    ...prev,
                    checker: system.owner
                }));
            }
        }
    }, [formData.systemName, systems]);

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

            onSuccess();
        } catch (err) {
            console.error("Submission error:", err);
            alert("提交失敗，請檢查網路連線。");
        } finally {
            setSubmitting(false);
        }
    };

    // 檢查所有檢核項目是否都已填寫
    const allItemsFilled = checkItems.every(item => formData[item.id]);
    const isFormValid = formData.systemName && formData.checker && allItemsFilled;

    // 按項目編號前綴分組 (ED, EM, EY, etc.)
    const groupedItems = checkItems.reduce((acc, item) => {
        const prefix = item.id.match(/^[A-Z]+/)?.[0] || 'OTHER';
        if (!acc[prefix]) acc[prefix] = [];
        acc[prefix].push(item);
        return acc;
    }, {});

    // 獲取代理人選項
    const getDeputyOptions = () => {
        if (!selectedSystem) return [];
        const options = [];
        if (selectedSystem.deputy) options.push(selectedSystem.deputy);
        if (selectedSystem.generalDeputy) options.push(selectedSystem.generalDeputy);
        return [...new Set(options)]; // 去重
    };

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

                {/* Checklist - Grouped by Category */}
                <div className="space-y-4">
                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="bg-white p-4 rounded-xl border border-morandi-border">
                            <h3 className="text-sm font-bold text-morandi-primary mb-3 uppercase">{category}</h3>
                            <div className="space-y-2">
                                {items.map(item => (
                                    <CheckItem
                                        key={item.id}
                                        id={item.id}
                                        label={item.description}
                                        value={formData[item.id] || ''}
                                        onChange={handleChange}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
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
