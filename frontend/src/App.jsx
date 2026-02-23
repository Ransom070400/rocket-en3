import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { EventsProvider } from './context/EventsContext'
import Navbar from './components/layout/Navbar'
import Landing from './pages/Landing'
import BrowseEvents from './pages/BrowseEvents'
import CreateEvent from './pages/CreateEvent'
import MyTickets from './pages/MyTickets'
import EventDetail from './pages/EventDetail'
import OrganizerDashboard from './pages/OrganizerDashboard'

export default function App() {
  return (
    <WalletProvider>
      <EventsProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/"             element={<Landing />} />
            <Route path="/events"       element={<BrowseEvents />} />
            <Route path="/events/:id"   element={<EventDetail />} />
            <Route path="/create"       element={<CreateEvent />} />
            <Route path="/my-tickets"   element={<MyTickets />} />
            <Route path="/dashboard"    element={<OrganizerDashboard />} />
          </Routes>
        </div>
      </EventsProvider>
    </WalletProvider>
  )
}
