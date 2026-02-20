import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useReconnect } from '../hooks/useReconnect'

function Home() {
  // Attempt to reconnect user on page load
  useReconnect()
  
  useEffect(() => {
    document.title = 'UNCOLYMPICS - Home';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-12">
      {/* Title */}
      <h1 className="text-6xl md:text-8xl font-heading text-primary text-center">
        UNCOLYMPICS
      </h1>

      {/* Glass Panel with Buttons */}
      <div className="glass-panel p-8 w-full max-w-sm space-y-6">
        <Link to="/create" className="block">
          <button className="btn-navy w-full text-xl font-semibold">
            Create Tournament
          </button>
        </Link>

        <Link to="/join" className="block">
          <button className="btn-navy w-full text-xl font-semibold">
            Join Tournament
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Home