'use client'

import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'

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

  const handleDelete = async id => {
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
        {items.map(item => (
          <div
            key={item.id}
            style={{ border: '1px solid #ccc', padding: 10, width: 250 }}
          >
            <img src={item.image} alt={item.title} style={{ width: '100%' }} />
            <input
              type="file"
              onChange={e => handleImageChange(item.id, e)}
              style={{ margin: '8px 0' }}
            />
            <h4 style={{ fontSize: 14 }}>{item.title}</h4>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.id}
            </a>
            <input
              type="text"
              placeholder="Remark"
              value={item.remark || ''}
              onChange={e => handleFieldChange(item.id, 'remark', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <input
              type="text"
              placeholder="Bar code"
              value={item.barcode || ''}
              onChange={e => handleFieldChange(item.id, 'barcode', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <input
              type="text"
              placeholder="Extra notes..."
              value={item.note || ''}
              onChange={e => handleFieldChange(item.id, 'note', e.target.value)}
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
