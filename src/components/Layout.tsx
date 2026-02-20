import { ReactNode } from 'react'
import { ConnectionBanner } from './ui/ConnectionBanner'
import { ToastContainer } from './ui/ToastContainer'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen app-container">
      <ConnectionBanner />
      {children}
      <ToastContainer />
    </div>
  )
}

export default Layout