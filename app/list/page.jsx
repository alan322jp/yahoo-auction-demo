'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../lib/firebase'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'

export default function ListPage() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState({})
  const [popupImage, setPopupImage] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('unsold')
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'auctions'))
      const list = snapshot.docs.map(docSnap => ({
        docId: docSnap.id,
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
          image2: item.image2 || '',
          uid: item.uid || item.docId,
        }
      })
      setEditing(edits)
    }
    fetchData()
  }, [])

  const filteredItems = items.filter(item => {
    const keyword = search.toLowerCase()
    const matchKeyword = (
      item.title?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.remark?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.barcode?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.uid?.toLowerCase().includes(keyword)
    )
    const matchStatus =
      filterStatus === 'unsold' ? (!item.sold && !item.finish) :
      filterStatus === 'sold_unpaid' ? (item.sold && !item.finish && !item.paid) :
      filterStatus === 'sold_paid' ? (item.sold && !item.finish && item.paid) :
      filterStatus === 'finished' ? (item.finish) :
      true
    return matchKeyword && matchStatus
  })

  return (
    <div style={{ padding: 20 }}>
      <h1>Yahoo Auction Item List</h1>
      <input
        type="text"
        placeholder="Search title / remark / barcode / uid"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 20, width: '100%', padding: 8 }}
      />
      <div style={{ marginBottom: 20 }}>
        {['unsold', 'sold_unpaid', 'sold_paid', 'finished', 'all'].map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{ marginRight: 8 }}>
            {status.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {filteredItems.map(item => (
          <div key={item.docId} style={{ border: '1px solid #ccc', padding: 10, width: 250 }}>
            <div style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>{editing[item.docId]?.uid || item.docId}</div>
            <img src={editing[item.docId]?.image || ''} style={{ width: '100%', height: 180, objectFit: 'contain' }} alt="Main" />
            <h4>{item.title}</h4>
          </div>
        ))}
      </div>
    </div>
  )
}