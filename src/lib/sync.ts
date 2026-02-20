import { supabase } from './supabase';
import useGameStore from '../stores/gameStore';
import type { Tournament, Player, Team, LeaderVote } from '../types';

export function subscribeTournament(tournamentId: string) {
  const channel = supabase.channel(`tournament:${tournamentId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'players', 
      filter: `tournament_id=eq.${tournamentId}` 
    }, (payload) => {
      const store = useGameStore.getState();
      
      if (payload.eventType === 'INSERT') {
        // Add new player to store
        store.addPlayer(payload.new as Player);
      } else if (payload.eventType === 'UPDATE') {
        // Update existing player in store (team change, leader change)
        store.updatePlayer(payload.new as Player);
      } else if (payload.eventType === 'DELETE') {
        // Remove player from store
        store.removePlayer(payload.old.id);
      }
    })
    .on('postgres_changes', {
      event: '*', 
      schema: 'public', 
      table: 'teams',
      filter: `tournament_id=eq.${tournamentId}`
    }, (payload) => {
      const store = useGameStore.getState();
      
      if (payload.eventType === 'INSERT') {
        // Add new team to store
        store.addTeam(payload.new as Team);
      } else if (payload.eventType === 'UPDATE') {
        // Update existing team in store
        store.updateTeam(payload.new as Team);
      } else if (payload.eventType === 'DELETE') {
        // Remove team from store
        store.removeTeam(payload.old.id);
      }
    })
    .on('postgres_changes', {
      event: '*', 
      schema: 'public', 
      table: 'tournaments',
      filter: `id=eq.${tournamentId}`
    }, (payload) => {
      const store = useGameStore.getState();
      
      if (payload.eventType === 'UPDATE') {
        // Handle status changes (lobby→picking) and other tournament updates
        store.setTournament(payload.new as Tournament);
      }
    })
    .on('postgres_changes', {
      event: '*', 
      schema: 'public', 
      table: 'leader_votes'
    }, (payload) => {
      const store = useGameStore.getState();
      
      // For leader votes, we need to check if this vote affects our tournament
      // Since we can't filter by tournament_id directly, we'll handle all votes
      // and let the store filter them based on current teams
      if (payload.eventType === 'INSERT') {
        store.addVote(payload.new as LeaderVote);
      } else if (payload.eventType === 'UPDATE') {
        store.updateVote(payload.new as LeaderVote);
      } else if (payload.eventType === 'DELETE') {
        store.removeVote(payload.old.id);
      }
    })
    .subscribe((status) => {
      const store = useGameStore.getState();
      if (status === 'SUBSCRIBED') {
        store.setConnectionStatus('connected');
      } else if (status === 'CLOSED') {
        store.setConnectionStatus('disconnected');
      } else if (status === 'CHANNEL_ERROR') {
        store.setConnectionStatus('reconnecting');
      }
    });
    
  return () => {
    supabase.removeChannel(channel);
  };
}