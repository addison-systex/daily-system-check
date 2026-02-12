import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

const CheckItem = ({ id, label, value, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-morandi-border last:border-0 group hover:bg-gray-50 px-2 rounded-lg transition-colors">
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
                    checked={value === 'Y'}
                    onChange={() => onChange(id, 'Y')}
                    className="form-radio text-morandi-accent focus:ring-morandi-accent h-4 w-4"
                />
                <span className="text-sm">是 (Y)</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
                <input
                    type="radio"
                    name={id}
                    value="N"
                    checked={value === 'N'}
                    onChange={() => onChange(id, 'N')}
                    className="form-radio text-red-400 focus:ring-red-400 h-4 w-4"
                />
                <span className="text-sm">否 (N)</span>
            </label>
        </div>
    </div>
);

export default function CheckForm({ systems, onSuccess }) {
    const [formData, setFormData] = useState({
        systemName: '',
        checker: '',
        isDeputy: false,
        deputyName: '',
        ED01: '', EM01: '', EY01: '',
        ED02: '', EM02: '', EY02: '',
        ED03: '', EY03: '', ED04: '',
        OT01: ''
    });

    const [submitting, setSubmitting] = useState(false);

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // 使用 fetch POST 發送資料
            // Google Apps Script 會有 CORS 限制，通常使用 no-cors 模式，或者傳送 text/plain
            const response = await fetch(import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(formData),
                // 使用 text/plain 避免觸發複雜的 CORS preflight
                headers: { "Content-Type": "text/plain" }
            });

            // 因為 GAS 重導向特性，有時無法直接讀取 response.json()
            // 若無報錯即視為成功
            onSuccess();
        } catch (err) {
            console.error("Submission error:", err);
            alert("提交失敗，請檢查網路連線。");
        } finally {
            setSubmitting(false);
        }
    };

    const isFormValid = formData.systemName && formData.checker &&
        Object.keys(formData).filter(k => k.match(/E[DMY][0-9]+/)).every(k => formData[k]);

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
                            {systems.map(s => <option key={s.name} value={s.name}>{s.name} ({s.owner})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-morandi-text mb-1">檢核人姓名</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                                value={formData.checker}
                                onChange={(e) => handleChange('checker', e.target.value)}
                                required
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
                            <label className="block text-sm font-medium text-morandi-text mb-1">代理人姓名</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none"
                                value={formData.deputyName}
                                onChange={(e) => handleChange('deputyName', e.target.value)}
                                required={formData.isDeputy}
                            />
                        </motion.div>
                    )}
                </div>

                {/* Checklist */}
                <div className="space-y-1">
                    <CheckItem id="ED01" label="檢查 AP/DB Server 是否運作中" value={formData.ED01} onChange={handleChange} />
                    <CheckItem id="EM01" label="Windows Update 安裝與防毒更新確認" value={formData.EM01} onChange={handleChange} />
                    <CheckItem id="EY01" label="系統管理帳號密碼 Review 與變更" value={formData.EY01} onChange={handleChange} />
                    <CheckItem id="ED02" label="檢查 AP、DB 備份是否完成" value={formData.ED02} onChange={handleChange} />
                    <CheckItem id="EM02" label="CPU/記憶體效能檢查" value={formData.EM02} onChange={handleChange} />
                    <CheckItem id="EY02" label="清查應用系統權限，並製作權限報表" value={formData.EY02} onChange={handleChange} />
                    <CheckItem id="ED03" label="檢查主機硬碟空間是否足夠" value={formData.ED03} onChange={handleChange} />
                    <CheckItem id="EY03" label="系統還原演練" value={formData.EY03} onChange={handleChange} />
                    <CheckItem id="ED04" label="檢查 File Server 空間是否足夠" value={formData.ED04} onChange={handleChange} />
                </div>

                {/* Other */}
                <div>
                    <label className="block text-sm font-medium text-morandi-text mb-1"><span className="text-morandi-primary font-bold mr-2">OT01</span>其它異常說明 (選填)</label>
                    <textarea
                        className="w-full rounded-lg border-morandi-border bg-white p-2.5 text-sm focus:ring-2 focus:ring-morandi-primary outline-none h-20 resize-none"
                        value={formData.OT01}
                        onChange={(e) => handleChange('OT01', e.target.value)}
                    />
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
