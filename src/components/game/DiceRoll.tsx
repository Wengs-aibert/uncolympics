import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useLobbyStore from '../../stores/lobbyStore'
import { submitDicePick, resetDiceRoll, confirmDiceWinner } from '../../lib/api'
import { toast } from '../../lib/toast'
import type { DiceRollData } from '../../types'

type Phase = 'picking' | 'revealing' | 'result' | 'tie'

interface DiceRollProps {
  onComplete: () => void  // called when winner is confirmed and we move to game pick
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function DiceRoll({ onComplete }: DiceRollProps) {
  const { tournament, currentPlayer, teams, players, setTournament } = useLobbyStore()
  const [phase, setPhase] = useState<Phase>('picking')
  const [myPick, setMyPick] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [shuffleEmoji, setShuffleEmoji] = useState('🎲')

  const sortedTeams = [...teams].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const teamA = sortedTeams[0]
  const teamB = sortedTeams[1]

  const myTeam = teams.find(t => t.id === currentPlayer?.team_id)
  const isLeader = currentPlayer?.is_leader === true
  const isReferee = currentPlayer?.role === 'referee'

  const rollData: DiceRollData | null = tournament?.dice_roll_data || null

  // Determine phase from rollData
  useEffect(() => {
    if (!rollData) {
      setPhase('picking')
      return
    }

    if (rollData.target !== null) {
      // Both picked, target generated
      if (rollData.winnerId) {
        setPhase('result')
      } else {
        setPhase('tie')
      }
    } else {
      setPhase('picking')
    }

    // Check if I already submitted this round
    if (rollData && myTeam && rollData.picks[myTeam.id] !== undefined) {
      setMyPick(rollData.picks[myTeam.id])
      setSubmitted(true)
    } else {
      setMyPick(null)
      setSubmitted(false)
    }
  }, [rollData, myTeam?.id])

  // Shuffle animation during reveal
  useEffect(() => {
    if (phase !== 'revealing') return
    const interval = setInterval(() => {
      setShuffleEmoji(DICE_FACES[Math.floor(Math.random() * 6)])
    }, 100)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      // Phase will be updated by realtime when tournament updates
    }, 2000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [phase])

  const handlePick = async (num: number) => {
    if (!tournament?.id || !myTeam?.id || submitted) return
    setMyPick(num)
    setSubmitted(true)

    try {
      const updated = await submitDicePick(tournament.id, myTeam.id, num)
      setTournament(updated)
    } catch (err) {
      toast.error('Failed to submit pick')
      setSubmitted(false)
      setMyPick(null)
    }
  }

  const handleReRoll = async () => {
    if (!tournament?.id) return
    try {
      const updated = await resetDiceRoll(tournament.id)
      setTournament(updated)
    } catch (err) {
      toast.error('Failed to reset dice roll')
    }
  }

  const handleConfirmWinner = async () => {
    if (!tournament?.id) return
    try {
      const updated = await confirmDiceWinner(tournament.id)
      setTournament(updated)
      onComplete()
    } catch (err) {
      toast.error('Failed to confirm winner')
    }
  }

  const teamAPick = rollData?.picks[teamA?.id] ?? null
  const teamBPick = rollData?.picks[teamB?.id] ?? null
  const target = rollData?.target ?? null
  const winnerId = rollData?.winnerId ?? null
  const winnerTeam = winnerId ? teams.find(t => t.id === winnerId) : null
  const round = rollData?.round ?? 1

  const leaderA = players.find(p => p.team_id === teamA?.id && p.is_leader)
  const leaderB = players.find(p => p.team_id === teamB?.id && p.is_leader)

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-heading text-primary mb-2">
          🎲 DICE ROLL {round > 1 ? `(Round ${round})` : ''}
        </h1>
        <p className="text-secondary">
          Team leaders pick a number. Closest to the roll wins first pick!
        </p>
      </motion.div>

      {/* Team picks display */}
      <div className="flex gap-8 mb-8 w-full max-w-lg justify-center">
        {/* Team A */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-panel p-4 text-center"
        >
          <div className="text-sm text-cyan-400 font-heading mb-1">{teamA?.name}</div>
          <div className="text-xs text-secondary mb-3">{leaderA?.name}</div>
          <div className="text-5xl mb-2">
            {phase === 'picking' && teamAPick !== null ? '✅' : 
             phase === 'picking' ? '❓' :
             DICE_FACES[(teamAPick ?? 1) - 1]}
          </div>
          {(phase === 'result' || phase === 'tie') && teamAPick !== null && (
            <div className="text-2xl font-bold text-white">{teamAPick}</div>
          )}
        </motion.div>

        {/* VS / Target */}
        <div className="flex flex-col items-center justify-center">
          {phase === 'picking' ? (
            <div className="text-2xl font-heading text-secondary">VS</div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-center"
            >
              <div className="text-xs text-secondary mb-1">TARGET</div>
              <div className="text-4xl">{target !== null ? DICE_FACES[target - 1] : shuffleEmoji}</div>
              {target !== null && (
                <div className="text-xl font-bold text-amber-400">{target}</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Team B */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-panel p-4 text-center"
        >
          <div className="text-sm text-pink-400 font-heading mb-1">{teamB?.name}</div>
          <div className="text-xs text-secondary mb-3">{leaderB?.name}</div>
          <div className="text-5xl mb-2">
            {phase === 'picking' && teamBPick !== null ? '✅' :
             phase === 'picking' ? '❓' :
             DICE_FACES[(teamBPick ?? 1) - 1]}
          </div>
          {(phase === 'result' || phase === 'tie') && teamBPick !== null && (
            <div className="text-2xl font-bold text-white">{teamBPick}</div>
          )}
        </motion.div>
      </div>

      {/* Pick buttons (only for leaders who haven't picked) */}
      {phase === 'picking' && isLeader && !submitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-primary font-heading mb-3">Pick your number!</p>
          <div className="grid grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePick(num)}
                className="w-14 h-14 glass-panel text-2xl font-bold text-white hover:border-amber-400 transition-colors"
              >
                {num}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Waiting states */}
      {phase === 'picking' && isLeader && submitted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-secondary">You picked <span className="text-primary font-bold">{myPick}</span>. Waiting for the other leader...</p>
        </motion.div>
      )}

      {phase === 'picking' && !isLeader && !isReferee && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-secondary">Waiting for team leaders to pick their numbers...</p>
        </motion.div>
      )}

      {phase === 'picking' && isReferee && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-secondary">
            {teamAPick !== null && teamBPick !== null
              ? 'Both leaders have picked!'
              : `Waiting for leaders to pick... (${(teamAPick !== null ? 1 : 0) + (teamBPick !== null ? 1 : 0)}/2)`}
          </p>
        </motion.div>
      )}

      {/* Winner announcement */}
      <AnimatePresence>
        {phase === 'result' && winnerTeam && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mb-6 text-center"
          >
            <div className="text-lg text-secondary mb-2">🎉 Winner!</div>
            <div className="text-3xl font-heading text-amber-400 mb-2">
              {winnerTeam.name}
            </div>
            <p className="text-secondary">picks the first game!</p>

            {(isReferee || (isLeader && currentPlayer?.team_id === winnerId)) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={handleConfirmWinner}
                className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
              >
                Continue to Game Pick →
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Tie */}
        {phase === 'tie' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 text-center"
          >
            <div className="text-3xl font-heading text-yellow-400 mb-2">🤝 IT'S A TIE!</div>
            <p className="text-secondary mb-4">Both leaders were equally close. Roll again!</p>

            {(isReferee || isLeader) && (
              <button
                onClick={handleReRoll}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
              >
                🎲 Roll Again
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
