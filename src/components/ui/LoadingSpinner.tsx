import { motion } from 'framer-motion'

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center py-20">
      {/* Pulsing UNCOLYMPICS text */}
      <motion.div
        className="text-6xl md:text-8xl font-black text-cyan-400 mb-8"
        style={{ fontFamily: 'Bebas Neue, Impact, Arial Black, sans-serif' }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        UNCOLYMPICS
      </motion.div>
      
      {/* Bouncing dots */}
      <div className="flex gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-4 h-4 bg-cyan-400 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <motion.p 
        className="text-gray-300 text-lg"
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}