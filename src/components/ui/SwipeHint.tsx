import { motion, AnimatePresence } from 'framer-motion'

interface SwipeHintProps {
  visible: boolean
  text?: string
  className?: string
}

export const SwipeHint = ({ 
  visible, 
  text = '↑ Swipe up',
  className = '' 
}: SwipeHintProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 text-xl font-light ${className}`}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}