'use client'

// Next.js 14 App Router version (with Firebase Firestore)

// app/api/fetchYahoo/route.js
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new Response('Missing URL', { status: 400 })
  }

  try {
    const res = await fetch(targetUrl, { cache: 'no-store' })
    const html = await res.text()
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (err) {
    return new Response('Failed to fetch target URL', { status: 500 })
  }
}

// app/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }

// app/input/page.jsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

async function parseYahooAuction(url) {
  const res = await fetch(`/api/fetchYahoo?url=${encodeURIComponent(url)}`)
  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const title = doc.querySelector('title')?.textContent || 'NO TITLE'
  const image = doc.querySelector('meta[property="og:image"]')?.content || ''
  const id = url.split('/').pop()

  return { title, url, id, image, note: '', remark: '', barcode: '' }
}

export default function InputPage() {
  const [inputUrl, setInputUrl] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputUrl.includes('yahoo.co.jp')) return

    const parsed = await parseYahooAuction(inputUrl)
    await addDoc(collection(db, 'auctions'), parsed)
    setInputUrl('')
    router.push('/list')
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Add Yahoo Auction</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste Yahoo Auction URL"
          style={{ width: '100%', padding: 8, fontSize: 16 }}
        />
        <button style={{ marginTop: 10, padding: '8px 16px' }} type="submit">
          Save & View List
        </button>
      </form>
    </div>
  )
}

// app/list/page.jsx
'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'

export default function ListPage() {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'auctions'))
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setItems(list)
    }

    fetchData()
  }, [])

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'auctions', id))
    setItems(items.filter(item => item.id !== id))
  }

  const handleFieldChange = async (id, field, value) => {
    await updateDoc(doc(db, 'auctions', id), { [field]: value })
    setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleImageChange = async (id, event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const imageBase64 = reader.result
      await updateDoc(doc(db, 'auctions', id), { image: imageBase64 })
      setItems(items.map(item => (item.id === id ? { ...item, image: imageBase64 } : item)))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Saved Yahoo Auctions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{ border: '1px solid #ccc', padding: 10, width: 250 }}
          >
            <img src={item.image} alt={item.title} style={{ width: '100%' }} />
            <input type="file" onChange={(e) => handleImageChange(item.id, e)} style={{ margin: '8px 0' }} />
            <h4 style={{ fontSize: 14 }}>{item.title}</h4>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.id}
            </a>
            <input
              type="text"
              placeholder="Remark"
              value={item.remark || ''}
              onChange={(e) => handleFieldChange(item.id, 'remark', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <input
              type="text"
              placeholder="Bar code"
              value={item.barcode || ''}
              onChange={(e) => handleFieldChange(item.id, 'barcode', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <input
              type="text"
              placeholder="Extra notes..."
              value={item.note || ''}
              onChange={(e) => handleFieldChange(item.id, 'note', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <button
              onClick={() => handleDelete(item.id)}
              style={{ marginTop: 8, padding: '4px 8px', fontSize: 12 }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
