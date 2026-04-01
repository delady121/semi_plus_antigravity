import React from 'react'
import { GNB } from './GNB'
import { LNB } from './LNB'

interface PageLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <GNB />
      <LNB />
      <main
        className="transition-all duration-200"
        style={{ paddingTop: 60, paddingLeft: 220 }}
      >
        <div className={fullWidth ? 'h-full' : 'p-6 max-w-[1600px]'}>
          {children}
        </div>
      </main>
    </div>
  )
}

