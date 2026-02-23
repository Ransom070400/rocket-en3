/**
 * IndexedDB store for offline scanner.
 * Stores:
 *  - valid_tickets: Set of valid ticket hashes from Merkle tree download
 *  - checked_in: Map of tokenId => {timestamp, eventId}
 *  - pending_sync: Queue of check-ins to sync when online
 *  - merkle_data: {eventId, root, leaves, tree} for each event
 */
import { openDB } from 'idb'

const DB_NAME    = 'rocket-en3-scanner'
const DB_VERSION = 1

let _db = null

export async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Valid tickets for this event
      if (!db.objectStoreNames.contains('valid_tickets')) {
        db.createObjectStore('valid_tickets', { keyPath: 'tokenId' })
      }
      // Check-ins (local)
      if (!db.objectStoreNames.contains('checked_in')) {
        db.createObjectStore('checked_in', { keyPath: 'tokenId' })
      }
      // Pending sync queue
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true })
      }
      // Merkle data per event
      if (!db.objectStoreNames.contains('merkle_data')) {
        db.createObjectStore('merkle_data', { keyPath: 'eventId' })
      }
      // Used nonces (replay protection offline)
      if (!db.objectStoreNames.contains('used_nonces')) {
        db.createObjectStore('used_nonces', { keyPath: 'nonce' })
      }
    },
  })
  return _db
}

export async function saveValidTickets(eventId, tickets) {
  const db = await getDB()
  const tx = db.transaction('valid_tickets', 'readwrite')
  for (const ticket of tickets) {
    await tx.store.put({ ...ticket, eventId })
  }
  await tx.done
}

export async function isValidTicket(tokenId) {
  const db = await getDB()
  const ticket = await db.get('valid_tickets', tokenId)
  return !!ticket
}

export async function isCheckedIn(tokenId) {
  const db = await getDB()
  const rec = await db.get('checked_in', tokenId)
  return !!rec
}

export async function markCheckedIn(tokenId, eventId, owner) {
  const db = await getDB()
  const now = Date.now()
  await db.put('checked_in', { tokenId, eventId, owner, timestamp: now, synced: false })
  await db.add('pending_sync', { tokenId, eventId, owner, timestamp: now })
}

export async function getPendingSync() {
  const db = await getDB()
  return db.getAll('pending_sync')
}

export async function clearPendingSync(ids) {
  const db = await getDB()
  const tx = db.transaction('pending_sync', 'readwrite')
  for (const id of ids) {
    await tx.store.delete(id)
  }
  await tx.done
}

export async function saveMerkleData(eventId, root, leaves) {
  const db = await getDB()
  await db.put('merkle_data', { eventId, root, leaves, savedAt: Date.now() })
}

export async function getMerkleData(eventId) {
  const db = await getDB()
  return db.get('merkle_data', eventId)
}

export async function isNonceUsed(nonce) {
  const db = await getDB()
  const rec = await db.get('used_nonces', nonce)
  return !!rec
}

export async function markNonceUsed(nonce) {
  const db = await getDB()
  await db.put('used_nonces', { nonce, usedAt: Date.now() })
}

export async function getCheckedInCount() {
  const db = await getDB()
  return db.count('checked_in')
}

export async function getAllCheckedIn() {
  const db = await getDB()
  return db.getAll('checked_in')
}
