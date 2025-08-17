"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

export interface ToastManagerHandles {
    show: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastManager = forwardRef<ToastManagerHandles, object>((_, ref) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useImperativeHandle(ref, () => ({
        show(message: string, type: ToastType = 'success', duration: number = 3000) {
            const id = Math.random().toString(36).substr(2, 9);
            const newToast: Toast = { id, message, type };

            setToasts(prev => [...prev, newToast]);

            setTimeout(() => {
                removeToast(id);
            }, duration);
        },
    }));

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const getToastStyles = (type: ToastType) => {
        switch (type) {
            case 'success':
                return {
                    icon: '✓',
                    iconBg: 'bg-emerald-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-emerald-200'
                };
            case 'error':
                return {
                    icon: '✕',
                    iconBg: 'bg-red-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-red-200'
                };
            case 'warning':
                return {
                    icon: '!',
                    iconBg: 'bg-amber-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-amber-200'
                };
            default:
                return {
                    icon: '✓',
                    iconBg: 'bg-emerald-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-emerald-200'
                };
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
            <div className="flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const styles = getToastStyles(toast.type);

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                    duration: 0.15
                                }}
                                className="pointer-events-auto"
                            >
                                <div
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${styles.bgColor} ${styles.borderColor} min-w-[300px] max-w-[400px] cursor-pointer group hover:shadow-xl transition-shadow duration-200`}
                                    onClick={() => removeToast(toast.id)}
                                >
                                    <div className={`w-5 h-5 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-white text-xs font-bold">
                                            {styles.icon}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-medium ${styles.textColor} flex-1`}>
                                        {toast.message}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-gray-400 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
});

ToastManager.displayName = 'ToastManager';

export default ToastManager;
