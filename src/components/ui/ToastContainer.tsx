import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore } from '../../stores/toastStore'

function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  const getToastStyles = (type: 'error' | 'success' | 'info') => {
    switch (type) {
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-300'
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-300'
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
      default:
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center p-4 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ 
              opacity: 0, 
              y: 50, 
              scale: 0.9 
            }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              y: -50, 
              scale: 0.9 
            }}
            transition={{ 
              duration: 0.3, 
              ease: 'easeOut' 
            }}
            layout
            className="w-full max-w-sm mb-3 pointer-events-auto"
          >
            <div
              className={`glass-panel p-3 text-sm cursor-pointer transition-opacity hover:opacity-80 ${getToastStyles(toast.type)}`}
              onClick={() => removeToast(toast.id)}
            >
              <p className="text-center">{toast.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export { ToastContainer }