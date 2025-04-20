
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [selected, setSelected] = useState({})
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'auctions'))
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return {
          docId: docSnap.id,
          ...data,
          selected: data.selected || false,
        }
      })
      const sortedList = list.sort((a, b) => (a.selected === b.selected ? 0 : a.selected ? 1 : -1))
      setItems(sortedList)

      const edits = {}
      const checks = {}
      sortedList.forEach(item => {
        edits[item.docId] = {
          remark: item.remark || '',
          barcode: item.barcode || '',
          note: item.note || '',
          image: item.image || '',
        }
        checks[item.docId] = item.selected || false
      })
      setEditing(edits)
      setSelected(checks)
    }

    fetchData()
  }, [])

  const autoSave = async (docId, data) => {
    try {
      await updateDoc(doc(db, 'auctions', docId), data)
      console.log('💾 Auto-saved:', docId)
    } catch (err) {
      console.error('❌ Auto-save failed:', err.message)
    }
  }

  const handleChange = (docId, field, value) => {
    setEditing(prev => {
      const updated = {
        ...prev,
        [docId]: {
          ...prev[docId],
          [field]: value,
        },
      }
      autoSave(docId, updated[docId])
      return updated
    })
  }

  const handleDelete = async docId => {
    try {
      await deleteDoc(doc(db, 'auctions', docId))
      setItems(items.filter(item => item.docId !== docId))
    } catch (err) {
      console.error('❌ Delete failed:', err.message)
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

  const toggleSelect = async (docId) => {
    const newValue = !selected[docId]
    setSelected(prev => ({ ...prev, [docId]: newValue }))
    try {
      await updateDoc(doc(db, 'auctions', docId), { selected: newValue })
    } catch (err) {
      console.error('❌ Failed to save selection:', err.message)
    }
  }

  const handleGoToFinished = () => {
    router.push('/finished')
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Saved Yahoo Auctions</h1>
      <button onClick={handleGoToFinished} style={{ marginBottom: 20 }}>
        View Finished Items
      </button>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {items.map(item => (
          <div
            key={item.docId}
            style={{
              border: '1px solid #ccc',
              padding: 10,
              width: 250,
              backgroundColor: selected[item.docId] ? '#d1e7dd' : 'white',
            }}
          >
            <label style={{ display: 'block', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={selected[item.docId] || false}
                onChange={() => toggleSelect(item.docId)}
              />{' '}
              Finish
            </label>

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
