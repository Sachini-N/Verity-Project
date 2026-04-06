import { motion } from 'framer-motion';
import { X, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ToastNotificationProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export default function ToastNotification({
  type = 'info',
  title,
  message,
  duration = 5000,
  onDismiss,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  const bgColor = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-indigo-50 border-indigo-200',
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 400 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 25,
      }}
      className={`${bgColor} border rounded-xl p-4 shadow-lg flex items-start gap-3 w-96 max-w-[calc(100vw-2rem)]`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{message}</p>
      </div>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
