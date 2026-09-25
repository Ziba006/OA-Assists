import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-warm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-surface-warm focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-sage-800 focus:shadow-soft"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 bg-surface">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
