import React, { createContext, useContext, useState, useCallback } from 'react'
import { useWallet } from './WalletContext'

const EventsContext = createContext(null)

export function EventsProvider({ children }) {
  const { contract } = useWallet()
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [fetched, setFetched]   = useState(false)

  const fetchEvents = useCallback(async () => {
    if (!contract) {
      setEvents([])
      setFetched(true)
      return
    }

    setLoading(true)
    try {
      const total = await contract.totalEvents()
      const list = []

      for (let id = 1; id <= total; id++) {
        try {
          const evt = await contract.events(id)

          // Build the event object
          list.push({
            id:          Number(evt.id),
            organizer:   evt.organizer,
            name:        evt.name,
            metadataCid: evt.metadataCid,
            startTime:   Number(evt.startTime),
            endTime:     Number(evt.endTime),
            ticketPrice: evt.ticketPrice,
            maxTickets:  Number(evt.maxTickets),
            soldTickets: Number(evt.soldTickets),
            merkleRoot:  evt.merkleRoot,
            active:      evt.active,
            ratingAvg:   0, // default until contract adds rating
            ratingCount: 0, // default until contract adds rating
          })
        } catch (err) {
          console.warn(`Failed to fetch event ${id}:`, err)
        }
      }

      // Only active events
      setEvents(list.filter(e => e.active))
      setFetched(true)
    } catch (err) {
      console.error('fetchEvents error:', err)
      setEvents([])
      setFetched(true)
    } finally {
      setLoading(false)
    }
  }, [contract])

  return (
    <EventsContext.Provider value={{ events, loading, fetched, fetchEvents, setEvents }}>
      {children}
    </EventsContext.Provider>
  )
}

export const useEvents = () => useContext(EventsContext)