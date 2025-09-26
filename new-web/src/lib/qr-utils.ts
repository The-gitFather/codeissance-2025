import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { createHash } from 'crypto'

const SECRET_KEY = process.env.QR_SECRET_KEY || 'default-secret'

export function generateQRToken(): string {
  const date = new Date().toISOString().split('T')[0]
  const hash = createHash('sha256')
  hash.update(date + SECRET_KEY)
  return hash.digest('hex')
}

export async function validateQRToken(token: string): Promise<boolean> {
  const qrDoc = await getDoc(doc(db, 'attendance-qr', 'current'))
  if (!qrDoc.exists()) return false
  
  const storedToken = qrDoc.data().token
  const generatedAt = new Date(qrDoc.data().generatedAt)
  
  // Check if token matches and was generated today
  return token === storedToken && 
    generatedAt.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
}