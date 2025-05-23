'use client'
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

  return { title, url, id, image }
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