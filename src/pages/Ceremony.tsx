import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../stores/gameStore'
import { fetchCeremonyData, saveGlobalTitles, updateTeamPoints, validateRoomCode } from '../lib/api'
import { calculateGlobalTitles } from '../lib/globalTitles'
import type { CeremonyData, TitleWithPlayer } from '../types'

type CeremonyPhase = 'loading' | 'global-titles' | 'winner-reveal' | 'summary'

function Ceremony() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()

  const { currentPlayer, tournament, setTournament } = useGameStore()

  const [phase, setPhase] = useState<CeremonyPhase>('loading')
  const [ceremonyData, setCeremonyData] = useState<CeremonyData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [globalRevealIndex, setGlobalRevealIndex] = useState(0)
  const [autoAdvancing, setAutoAdvancing] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([])

  // Generate confetti pieces
  const triggerConfetti = useCallback(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    const pieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: Math.random() * 10 + 5
    }))
    setConfettiPieces(pieces)
    setShowConfetti(true)
  }, [])

  // Initialize ceremony
  useEffect(() => {
    if (!roomCode) return

    const init = async () => {
      try {
        // If we don't have a tournament in store, look it up
        let tournamentId = tournament?.id
        if (!tournamentId) {
          const validation = await validateRoomCode(roomCode)
          if (!validation.valid || !validation.tournament) {
            setError('Tournament not found')
            return
          }
          tournamentId = validation.tournament.id
          setTournament(validation.tournament)
        }

        // Calculate and save global titles if referee and they don't exist yet
        if (currentPlayer?.role === 'referee') {
          const data = await fetchCeremonyData(tournamentId)
          if (data.globalTitles.length === 0) {
            const globalResults = await calculateGlobalTitles(tournamentId)
            if (globalResults.length > 0) {
              await saveGlobalTitles(tournamentId, globalResults)
              await updateTeamPoints(tournamentId)
            }
          }
        }

        // Fetch final ceremony data (with global titles included)
        const data = await fetchCeremonyData(tournamentId)
        setCeremonyData(data)

        if (data.globalTitles.length > 0) {
          setPhase('global-titles')
        } else {
          setPhase('winner-reveal')
        }
      } catch (err: any) {
        console.error('Ceremony init error:', err)
        setError(err.message || 'Failed to load ceremony')
      }
    }

    init()
  }, [roomCode, tournament, currentPlayer, setTournament])

  // Auto-advance global titles
  useEffect(() => {
    if (phase !== 'global-titles' || !autoAdvancing || !ceremonyData) return
    if (globalRevealIndex >= ceremonyData.globalTitles.length) return

    const timer = setTimeout(() => {
      setGlobalRevealIndex(prev => prev + 1)
    }, 5000) // Slower than game titles

    return () => clearTimeout(timer)
  }, [phase, globalRevealIndex, autoAdvancing, ceremonyData])

  // When all global titles revealed, move to winner
  useEffect(() => {
    if (phase !== 'global-titles' || !ceremonyData) return
    if (globalRevealIndex >= ceremonyData.globalTitles.length) {
      const timer = setTimeout(() => {
        setPhase('winner-reveal')
        triggerConfetti()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [globalRevealIndex, ceremonyData, phase, triggerConfetti])

  const handleTap = () => {
    if (phase === 'global-titles' && ceremonyData) {
      setAutoAdvancing(false)
      if (globalRevealIndex < ceremonyData.globalTitles.length) {
        setGlobalRevealIndex(prev => prev + 1)
      }
    }
  }

  // Loading
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-7xl mb-6"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏆
          </motion.div>
          <h1 className="text-3xl font-black mb-2">Preparing the Ceremony...</h1>
          <p className="text-gray-300">Calculating final awards</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!ceremonyData) return null

  const currentGlobalTitle = ceremonyData.globalTitles[globalRevealIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden" onClick={handleTap}>
      {/* Confetti */}
      {showConfetti && confettiPieces.map(piece => (
        <motion.div
          key={piece.id}
          className="absolute top-0 rounded-sm pointer-events-none"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size * 1.5,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 50,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0.8, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: 'easeIn'
          }}
        />
      ))}

      <AnimatePresence mode="wait">
        {/* PHASE: Global Title Reveal */}
        {phase === 'global-titles' && (
          <motion.div
            key="global-titles"
            className="min-h-screen flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <motion.div
              className="absolute top-4 left-4 right-4 flex justify-between items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-lg font-bold text-yellow-400">🏆 Tournament Awards</h2>
              <span className="bg-black/30 px-3 py-1 rounded-lg text-sm">
                {Math.min(globalRevealIndex + 1, ceremonyData.globalTitles.length)}/{ceremonyData.globalTitles.length}
              </span>
            </motion.div>

            {globalRevealIndex < ceremonyData.globalTitles.length && currentGlobalTitle ? (
              <GlobalTitleCard title={currentGlobalTitle} index={globalRevealIndex} />
            ) : (
              <motion.div className="text-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-3xl font-bold">All Awards Revealed!</h2>
                <p className="text-gray-300 mt-2">Now for the moment you've been waiting for...</p>
              </motion.div>
            )}

            <motion.p
              className="absolute bottom-6 text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              Tap to continue
            </motion.p>
          </motion.div>
        )}

        {/* PHASE: Winner Reveal */}
        {phase === 'winner-reveal' && (
          <motion.div
            key="winner"
            className="min-h-screen flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {ceremonyData.isTied ? (
              <motion.div className="text-center">
                <motion.div
                  className="text-8xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 1, type: 'spring' }}
                >
                  🤝
                </motion.div>
                <motion.h1
                  className="text-5xl md:text-7xl font-black mb-4 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  IT'S A TIE!
                </motion.h1>
                <motion.div
                  className="flex gap-8 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  {ceremonyData.teams.map(team => (
                    <div key={team.id} className="text-center">
                      <div className="text-2xl font-bold">{team.name}</div>
                      <div className="text-4xl text-yellow-400 font-black">{team.total_points.toFixed(1)} pts</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            ) : ceremonyData.winningTeam ? (
              <motion.div className="text-center">
                <motion.div
                  className="text-8xl mb-6"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: [0, 1.4, 1], rotate: 0 }}
                  transition={{ duration: 1.2, type: 'spring' }}
                >
                  🏆
                </motion.div>
                <motion.h1
                  className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  {ceremonyData.winningTeam.name} WINS!
                </motion.h1>
                <motion.div
                  className="text-6xl font-black text-yellow-400 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  {ceremonyData.winningTeam.total_points.toFixed(1)} pts
                </motion.div>

                {/* All team scores */}
                <motion.div
                  className="flex gap-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 }}
                >
                  {ceremonyData.teams.map(team => (
                    <div key={team.id} className={`text-center px-6 py-3 rounded-lg ${
                      team.id === ceremonyData.winningTeam?.id ? 'bg-yellow-500/20 border-2 border-yellow-400' : 'bg-white/5'
                    }`}>
                      <div className="font-bold text-lg">{team.name}</div>
                      <div className="text-2xl font-black">{team.total_points.toFixed(1)} pts</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            ) : null}

            <motion.button
              className="mt-12 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 px-8 py-4 rounded-lg font-bold text-xl text-black shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5 }}
              onClick={(e) => { e.stopPropagation(); setPhase('summary'); }}
            >
              View Tournament Summary →
            </motion.button>
          </motion.div>
        )}

        {/* PHASE: Summary Card */}
        {phase === 'summary' && (
          <motion.div
            key="summary"
            className="min-h-screen p-4 pt-8 pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Summary Card — screenshot-friendly */}
            <div className="max-w-lg mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-yellow-500/30 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-6 text-center border-b border-yellow-500/20">
                <div className="text-4xl mb-2">🏆</div>
                <h1 className="text-2xl font-black">{ceremonyData.tournament.name}</h1>
                <p className="text-gray-400 text-sm mt-1">UNCOLYMPICS</p>
              </div>

              {/* Winner */}
              <div className="p-6 text-center border-b border-gray-700">
                {ceremonyData.isTied ? (
                  <div className="text-xl font-bold text-yellow-400">🤝 TIE GAME</div>
                ) : ceremonyData.winningTeam ? (
                  <>
                    <div className="text-sm text-gray-400 uppercase tracking-wider">Champion</div>
                    <div className="text-3xl font-black text-yellow-400 mt-1">{ceremonyData.winningTeam.name}</div>
                    <div className="text-lg text-gray-300">{ceremonyData.winningTeam.total_points.toFixed(1)} points</div>
                  </>
                ) : null}
              </div>

              {/* Team Scores */}
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Final Scores</h3>
                <div className="space-y-2">
                  {ceremonyData.teams.map((team, i) => (
                    <div key={team.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <span className="font-bold">{team.name}</span>
                      </div>
                      <span className="font-black text-yellow-400">{team.total_points.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Games Played */}
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Games Played</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ceremonyData.games.map(game => (
                    <div key={game.id} className="bg-white/5 rounded-lg px-3 py-2 text-sm">
                      <span>{game.gameType.emoji} {game.gameType.name}</span>
                      {game.winnerName && (
                        <div className="text-xs text-gray-400">Won by {game.winnerName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Title Leaderboard */}
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Title Leaders</h3>
                <div className="space-y-1">
                  {ceremonyData.titleLeaderboard.slice(0, 5).map((entry, i) => (
                    <div key={entry.playerId} className="flex items-center justify-between text-sm">
                      <span>{i === 0 ? '👑' : '  '} {entry.playerName} <span className="text-gray-500">({entry.teamName})</span></span>
                      <span className="text-cyan-400 font-bold">{entry.titleCount} titles</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Awards */}
              {ceremonyData.globalTitles.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tournament Awards</h3>
                  <div className="space-y-2">
                    {ceremonyData.globalTitles.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={t.is_funny ? 'text-pink-400' : 'text-cyan-400'}>
                          {t.is_funny ? '😂' : '✨'}
                        </span>
                        <div>
                          <span className="font-bold">{t.title_name}</span>
                          <span className="text-gray-400"> — {t.playerName}</span>
                          <div className="text-xs text-gray-500">{t.title_desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="max-w-lg mx-auto mt-6 space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-4 rounded-lg font-bold text-lg"
              >
                🎮 New Tournament
              </button>
              <button
                onClick={() => navigate('/history')}
                className="w-full bg-white/10 hover:bg-white/20 px-6 py-4 rounded-lg font-bold text-lg"
              >
                📜 View History
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-component for global title card (bigger/slower than game titles)
function GlobalTitleCard({ title, index }: { title: TitleWithPlayer; index: number }) {
  return (
    <motion.div
      key={`global-${index}`}
      className="text-center max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Award Icon */}
      <motion.div
        className="text-7xl mb-6"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: [0, 1.3, 1], rotate: 0 }}
        transition={{ duration: 1, type: 'spring', bounce: 0.3 }}
      >
        {title.is_funny ? '😂' : '🏆'}
      </motion.div>

      {/* Title Name */}
      <motion.h1
        className={`text-5xl md:text-7xl font-black mb-4 ${
          title.is_funny
            ? 'text-pink-400 drop-shadow-[0_0_30px_rgba(244,114,182,0.7)]'
            : 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]'
        }`}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.15, 1] }}
        transition={{ duration: 1, delay: 0.3, type: 'spring', bounce: 0.4 }}
      >
        {title.title_name}
      </motion.h1>

      {/* Player Name */}
      <motion.div
        className="text-3xl md:text-4xl font-bold mb-6 text-white"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {title.playerName}
      </motion.div>

      {/* Description */}
      <motion.p
        className="text-xl md:text-2xl text-gray-300 mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.7 }}
      >
        {title.title_desc}
      </motion.p>

      {/* Points Badge */}
      <motion.div
        className={`inline-block px-8 py-4 rounded-full text-2xl font-black ${
          title.is_funny
            ? 'bg-pink-600/30 border-2 border-pink-400 text-pink-200'
            : 'bg-yellow-600/30 border-2 border-yellow-400 text-yellow-200'
        }`}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
      >
        +{title.points} points
      </motion.div>
    </motion.div>
  )
}

export default Ceremony
