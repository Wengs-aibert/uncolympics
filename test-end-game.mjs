import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabaseUrl = 'https://uohruuyjmcgemdyxhnnz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaHJ1dXlqbWNnZW1keXhobm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjQyMTgsImV4cCI6MjA4NzE0MDIxOH0.kPBhoTNOAD5z7qLhOMl29VggJdsPvCuZ4_3lFJDLgks'

// Create a test device ID
const testDeviceId = randomBytes(16).toString('hex')

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-device-id': testDeviceId
    }
  }
})

// Test function to simulate the endGame API call
async function testEndGame() {
  try {
    console.log('Testing End Game API call...')
    console.log('Device ID:', testDeviceId)

    // First, let's see if we can find any active tournaments
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'playing')
      .limit(5)

    if (tournamentError) {
      console.error('Error fetching tournaments:', tournamentError.message)
      return
    }

    if (!tournaments || tournaments.length === 0) {
      console.log('No active tournaments found in "playing" status')
      
      // Check if there are any tournaments at all
      const { data: allTournaments } = await supabase
        .from('tournaments')
        .select('id, status, room_code')
        .limit(5)
      
      console.log('Recent tournaments:', allTournaments)
      return
    }

    console.log(`Found ${tournaments.length} active tournament(s)`)
    
    // Get the first tournament
    const tournament = tournaments[0]
    console.log('Testing with tournament:', tournament.id, tournament.room_code)

    // Get games for this tournament
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('tournament_id', tournament.id)
      .eq('status', 'active')
      .limit(1)

    if (gamesError) {
      console.error('Error fetching games:', gamesError.message)
      return
    }

    if (!games || games.length === 0) {
      console.log('No active games found for this tournament')
      return
    }

    const game = games[0]
    console.log('Testing with game:', game.id)

    // Now test the endGame API call equivalent
    console.log('\n--- Testing Game Status Update ---')
    const { data: gameUpdateResult, error: gameError } = await supabase
      .from('games')
      .update({ status: 'titles' })
      .eq('id', game.id)
      .select()

    if (gameError) {
      console.error('❌ Game update failed:', gameError.message)
      console.error('Details:', gameError.details)
      console.error('Hint:', gameError.hint)
    } else {
      console.log('✅ Game update succeeded:', gameUpdateResult)
    }

    console.log('\n--- Testing Tournament Status Update ---')
    const { data: tournamentUpdateResult, error: tournamentUpdateError } = await supabase
      .from('tournaments')
      .update({ status: 'scoring' })
      .eq('id', tournament.id)
      .select()

    if (tournamentUpdateError) {
      console.error('❌ Tournament update failed:', tournamentUpdateError.message)
      console.error('Details:', tournamentUpdateError.details)
      console.error('Hint:', tournamentUpdateError.hint)
    } else {
      console.log('✅ Tournament update succeeded:', tournamentUpdateResult)
    }

    // Restore original status for testing
    if (!gameError) {
      await supabase.from('games').update({ status: 'active' }).eq('id', game.id)
    }
    if (!tournamentUpdateError) {
      await supabase.from('tournaments').update({ status: 'playing' }).eq('id', tournament.id)
    }

  } catch (err) {
    console.error('Test failed with exception:', err)
  }
}

testEndGame()