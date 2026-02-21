import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  'https://uohruuyjmcgemdyxhnnz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaHJ1dXlqbWNnZW1keXhobm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjQyMTgsImV4cCI6MjA4NzE0MDIxOH0.kPBhoTNOAD5z7qLhOMl29VggJdsPvCuZ4_3lFJDLgks'
)

const deviceId = crypto.randomUUID()
let tournamentId, playerId

console.log('=== UNCOLYMPICS CREATE LOBBY FLOW TEST ===')
console.log('device_id:', deviceId)
console.log()

// Step 1: Create tournament
console.log('--- STEP 1: INSERT tournament ---')
const { data: tournament, error: tErr } = await supabase
  .from('tournaments')
  .insert({
    name: 'Test Tournament',
    room_code: 'TEST9',
    num_games: 3,
    time_est_min: 60,
    status: 'lobby',
    current_pick_team: null
  })
  .select()
  .single()

console.log('tournament data:', JSON.stringify(tournament, null, 2))
console.log('tournament error:', tErr)

if (tErr) { console.log('❌ STEP 1 FAILED — cannot continue'); process.exit(1) }
tournamentId = tournament.id
console.log('✅ Tournament created:', tournamentId)
console.log()

// Step 1b: Insert player (referee)
console.log('--- STEP 1b: INSERT player (referee) ---')
const { data: player, error: pErr } = await supabase
  .from('players')
  .insert({
    tournament_id: tournamentId,
    name: 'TestRef',
    device_id: deviceId,
    role: 'referee',
    is_leader: true,
    team_id: null
  })
  .select()
  .single()

console.log('player data:', JSON.stringify(player, null, 2))
console.log('player error:', pErr)

if (pErr) { console.log('❌ STEP 1b FAILED'); } else {
  playerId = player.id
  console.log('✅ Player created:', playerId)
}
console.log()

// Step 1c: Verify SELECT back
console.log('--- STEP 1c: SELECT tournament back ---')
const { data: verify, error: vErr } = await supabase
  .from('tournaments')
  .select('*')
  .eq('id', tournamentId)
  .single()

console.log('verify data:', JSON.stringify(verify, null, 2))
console.log('verify error:', vErr)
console.log(vErr ? '❌ STEP 1c FAILED' : '✅ Tournament verified')
console.log()

// Step 2: reconnectPlayer equivalent
console.log('--- STEP 2: reconnectPlayer query (FK hint) ---')
const { data: reconnData, error: reconnErr } = await supabase
  .from('players')
  .select('*, tournament:tournaments!fk_players_tournament(*)')
  .eq('device_id', deviceId)
  .order('created_at', { ascending: false })
  .limit(5)

console.log('reconnect data:', JSON.stringify(reconnData, null, 2))
console.log('reconnect error:', reconnErr)

if (reconnErr) {
  console.log('❌ STEP 2 FAILED')
} else if (!reconnData || reconnData.length === 0) {
  console.log('❌ STEP 2 FAILED — returned 0 rows')
} else {
  const match = reconnData.find(r => r.tournament && r.tournament.status !== 'completed')
  if (match) {
    console.log('✅ reconnectPlayer found match, tournament status:', match.tournament.status)
  } else {
    console.log('❌ STEP 2 FAILED — no non-completed tournament found in results')
  }
}
console.log()

// Step 3: fetchLobbyState equivalent
console.log('--- STEP 3: fetch players for tournament ---')
const { data: lobbyPlayers, error: lErr } = await supabase
  .from('players')
  .select('*')
  .eq('tournament_id', tournamentId)

console.log('lobby players:', JSON.stringify(lobbyPlayers, null, 2))
console.log('lobby error:', lErr)
console.log(lErr ? '❌ STEP 3 FAILED' : `✅ Found ${lobbyPlayers?.length} player(s)`)
console.log()

// Step 4: Cleanup
console.log('--- STEP 4: DELETE test tournament ---')
const { error: delErr } = await supabase
  .from('tournaments')
  .delete()
  .eq('id', tournamentId)

console.log('delete error:', delErr)
console.log(delErr ? '❌ STEP 4 FAILED' : '✅ Cleaned up')
console.log()
console.log('=== TEST COMPLETE ===')
