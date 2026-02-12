import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SuccessScreen({ onReset }) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-16 text-center space-y-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
                <CheckCircle className="w-24 h-24 text-morandi-accent" />
            </motion.div>

            <div>
                <h2 className="text-2xl font-bold text-morandi-text">回報已完成！</h2>
                <p className="text-morandi-muted mt-2">感謝您的每日檢核，資料已寫入 Google Sheet。</p>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="px-6 py-2 bg-morandi-bg text-morandi-text rounded-full border border-morandi-border text-sm hover:bg-gray-100 transition-colors"
            >
                返回填寫其他系統
            </motion.button>
        </motion.div>
    );
}
