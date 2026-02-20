import { create } from 'zustand'
import type { Tournament, Player, Team, Game, Title, PlayerStat, LeaderVote, GameType } from '../types'

interface GameStore {
  // State
  tournament: Tournament | null
  currentPlayer: Player | null
  players: Player[]
  teams: Team[]
  votes: LeaderVote[]
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected'
  currentGame: Game | null
  titles: Title[]
  playerStats: PlayerStat[]
  
  // Sprint 3: Game Pick state
  availableGames: GameType[]
  pickedGames: Game[]
  currentPickTeam: string | null
  currentRound: number
  
  // Actions
  setTournament: (tournament: Tournament) => void
  setCurrentPlayer: (player: Player) => void
  
  // Player actions
  addPlayer: (player: Player) => void
  updatePlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setPlayers: (players: Player[]) => void
  
  // Team actions
  addTeam: (team: Team) => void
  updateTeam: (team: Team) => void
  removeTeam: (teamId: string) => void
  setTeams: (teams: Team[]) => void
  
  // Vote actions
  addVote: (vote: LeaderVote) => void
  updateVote: (vote: LeaderVote) => void
  removeVote: (voteId: string) => void
  setVotes: (votes: LeaderVote[]) => void
  
  // Connection status
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'disconnected') => void
  
  // Sprint 3: Game Pick actions
  setAvailableGames: (games: GameType[]) => void
  setPickedGames: (games: Game[]) => void
  setCurrentPickTeam: (teamId: string | null) => void
  setCurrentRound: (round: number) => void
  addPickedGame: (game: Game) => void
  
  // Legacy actions (keeping for existing functionality)
  setTeam: (playerId: string, teamId: string) => void
  setGame: (game: Game) => void
  addStat: (stat: PlayerStat) => void
  addTitle: (title: Title) => void
  reset: () => void
}

const useGameStore = create<GameStore>((set) => ({
  // Initial state
  tournament: null,
  currentPlayer: null,
  players: [],
  teams: [],
  votes: [],
  connectionStatus: 'disconnected',
  currentGame: null,
  titles: [],
  playerStats: [],
  
  // Sprint 3: Game Pick initial state
  availableGames: [],
  pickedGames: [],
  currentPickTeam: null,
  currentRound: 1,
  
  // Actions
  setTournament: (tournament) => set({ tournament }),
  
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  // Player actions
  addPlayer: (player) => set((state) => ({
    players: [...state.players.filter(p => p.id !== player.id), player]
  })),
  
  updatePlayer: (player) => set((state) => ({
    players: state.players.map(p => p.id === player.id ? player : p),
    // Update current player if it's the same person
    currentPlayer: state.currentPlayer?.id === player.id ? player : state.currentPlayer
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),
  
  setPlayers: (players) => set({ players }),
  
  // Team actions
  addTeam: (team) => set((state) => ({
    teams: [...state.teams.filter(t => t.id !== team.id), team]
  })),
  
  updateTeam: (team) => set((state) => ({
    teams: state.teams.map(t => t.id === team.id ? team : t)
  })),
  
  removeTeam: (teamId) => set((state) => ({
    teams: state.teams.filter(t => t.id !== teamId)
  })),
  
  setTeams: (teams) => set({ teams }),
  
  // Vote actions
  addVote: (vote) => set((state) => {
    const teamIds = state.teams.map(t => t.id);
    // Only add votes that belong to teams in current tournament
    if (teamIds.includes(vote.team_id)) {
      return {
        votes: [...state.votes.filter(v => v.id !== vote.id), vote]
      };
    }
    return state;
  }),
  
  updateVote: (vote) => set((state) => ({
    votes: state.votes.map(v => v.id === vote.id ? vote : v)
  })),
  
  removeVote: (voteId) => set((state) => ({
    votes: state.votes.filter(v => v.id !== voteId)
  })),
  
  setVotes: (votes) => set({ votes }),
  
  // Connection status
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  // Sprint 3: Game Pick actions
  setAvailableGames: (games) => set({ availableGames: games }),
  
  setPickedGames: (games) => set({ pickedGames: games }),
  
  setCurrentPickTeam: (teamId) => set({ currentPickTeam: teamId }),
  
  setCurrentRound: (round) => set({ currentRound: round }),
  
  addPickedGame: (game) => set((state) => ({
    pickedGames: [...state.pickedGames, game],
    // Remove the game type from available games
    availableGames: state.availableGames.filter(gt => gt.id !== game.game_type_id)
  })),
  
  // Legacy actions (keeping for existing functionality)
  setTeam: (playerId, teamId) => set((state) => ({
    players: state.players.map(p => 
      p.id === playerId ? { ...p, team_id: teamId } : p
    )
  })),
  
  setGame: (game) => set({ currentGame: game }),
  
  addStat: (stat) => set((state) => ({
    playerStats: [...state.playerStats, stat]
  })),
  
  addTitle: (title) => set((state) => ({
    titles: [...state.titles, title]
  })),
  
  reset: () => set({
    tournament: null,
    currentPlayer: null,
    players: [],
    teams: [],
    votes: [],
    connectionStatus: 'disconnected',
    currentGame: null,
    titles: [],
    playerStats: [],
    // Reset Sprint 3 state too
    availableGames: [],
    pickedGames: [],
    currentPickTeam: null,
    currentRound: 1
  })
}))

export default useGameStore