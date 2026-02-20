import React from 'react'
import { motion } from 'framer-motion'

interface ConfettiProps {
  show: boolean
}

const Confetti: React.FC<ConfettiProps> = ({ show }) => {
  if (!show) return null

  // Create 35 confetti pieces with Mario Party colors (gold, white, navy)
  const pieces = Array.from({ length: 35 }, (_, i) => {
    const colors = ['#FFD700', '#FFFFFF', '#1E3A8A', '#F59E0B', '#EF4444', '#10B981'] // Gold, white, navy, plus some vibrant colors
    return {
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      xDrift: (Math.random() - 0.5) * 200, // Random horizontal drift
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotations: 3 + Math.random() * 5 // Number of rotations
    }
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          className="absolute rounded-sm opacity-90"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.backgroundColor,
            width: `${piece.size}px`,
            height: `${piece.size * 1.2}px`,
          }}
          initial={{ 
            y: -20, 
            x: 0,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 50,
            x: piece.xDrift,
            rotate: piece.rotations * 360,
            opacity: [1, 1, 0.8, 0]
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: piece.delay,
            ease: "easeOut",
            opacity: {
              times: [0, 0.2, 0.8, 1]
            }
          }}
        />
      ))}
    </div>
  )
}

export default Confetti