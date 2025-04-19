'use client'
import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function ListPage() {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'auctions'))
      const list = snapshot.docs.map(doc => doc.data())
      setItems(list)
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>Saved Yahoo Auctions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{ border: '1px solid #ccc', padding: 10, width: 250 }}
          >
            <img src={item.image} alt={item.title} style={{ width: '100%' }} />
            <h4 style={{ fontSize: 14 }}>{item.title}</h4>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.id}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
