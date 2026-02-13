import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 自訂下拉選單組件
 * 完全掌控樣式，移除瀏覽器預設的醜陋藍色背景
 */
export default function CustomSelect({ value, onChange, options, placeholder, required }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    // 點擊外部關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={selectRef} className="relative">
            {/* 隱藏的原生 select（用於表單驗證） */}
            <select
                value={value}
                onChange={onChange}
                required={required}
                className="absolute opacity-0 pointer-events-none"
                tabIndex={-1}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            {/* 自訂下拉按鈕 */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full rounded-xl border-2 bg-gradient-to-br from-white to-slate-50 p-4 pr-10 text-base font-bold text-left outline-none transition-all shadow-sm hover:shadow-md ${isOpen
                        ? 'border-indigo-400 ring-4 ring-indigo-100'
                        : value
                            ? 'border-slate-200 text-slate-800'
                            : 'border-slate-200 text-slate-400'
                    }`}
            >
                {selectedOption ? selectedOption.label : placeholder}
            </button>

            {/* 自訂箭頭 */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <motion.svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </motion.svg>
            </div>

            {/* 下拉選項列表 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-slate-200 shadow-xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange({ target: { value: option.value } });
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-base font-bold transition-all ${value === option.value
                                            ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-900'
                                            : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
