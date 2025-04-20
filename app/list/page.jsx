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
  const [editing, setEditing] = useState({})

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'auctions'))
      const list = snapshot.docs.map(docSnap => ({
        docId: docSnap.id, // ← Firestore document ID
        ...docSnap.data(),
      }))
      setItems(list)
      const edits = {}
      list.forEach(item => {
        edits[item.docId] = {
          remark: item.remark || '',
          barcode: item.barcode || '',
          note: item.note || '',
          image: item.image || '',
        }
      })
      setEditing(edits)
    }

    fetchData()
  }, [])

  const handleDelete = async docId => {
    console.log('🗑 Try deleting:', docId)
    try {
      await deleteDoc(doc(db, 'auctions', docId))
      console.log('✅ Deleted:', docId)
      setItems(items.filter(item => item.docId !== docId))
    } catch (err) {
      console.error('❌ Delete failed:', err.message)
    }
  }

  const handleChange = (docId, field, value) => {
    setEditing(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [field]: value,
      },
    }))
  }

  const handleSave = async docId => {
    const data = editing[docId]
    const ref = doc(db, 'auctions', docId)
    console.log('📤 Try saving:', docId, data)
    try {
      await updateDoc(ref, data)
      console.log('✅ Saved:', docId)
      setItems(items.map(item => (item.docId === docId ? { ...item, ...data } : item)))
    } catch (err) {
      console.error('❌ Save failed:', err.message)
    }
  }

  const handleImageChange = async (docId, event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result
      handleChange(docId, 'image', base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Saved Yahoo Auctions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {items.map(item => (
          <div
            key={item.docId}
            style={{ border: '1px solid #ccc', padding: 10, width: 250 }}
          >
            <img
              src={editing[item.docId]?.image || ''}
              alt={item.title}
              style={{ width: '100%' }}
            />
            <input
              type="file"
              onChange={e => handleImageChange(item.docId, e)}
              style={{ margin: '8px 0' }}
            />
            <h4 style={{ fontSize: 14 }}>{item.title}</h4>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.id}
            </a>
            <input
              type="text"
              placeholder="Remark"
              value={editing[item.docId]?.remark || ''}
              onChange={e => handleChange(item.docId, 'remark', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <input
              type="text"
              placeholder="Bar code"
              value={editing[item.docId]?.barcode || ''}
              onChange={e => handleChange(item.docId, 'barcode', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <input
              type="text"
              placeholder="Note"
              value={editing[item.docId]?.note || ''}
              onChange={e => handleChange(item.docId, 'note', e.target.value)}
              style={{ width: '100%', marginTop: 8, padding: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => handleSave(item.docId)}
                style={{ marginTop: 8, padding: '4px 8px', fontSize: 12 }}
              >
                Save
              </button>
              <button
                onClick={() => handleDelete(item.docId)}
                style={{ marginTop: 8, padding: '4px 8px', fontSize: 12, color: 'red' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
