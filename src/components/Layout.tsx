import { ReactNode } from 'react'
import { ConnectionBanner } from './ui/ConnectionBanner'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen app-container">
      <ConnectionBanner />
      {children}
    </div>
  )
}

export default Layout