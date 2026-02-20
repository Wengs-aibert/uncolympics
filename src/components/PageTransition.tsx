import { motion } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{
        opacity: { duration: 0.25, ease: "easeOut" },
        scale: { duration: 0.25, ease: "easeOut" }
      }}
    >
      {children}
    </motion.div>
  );
}