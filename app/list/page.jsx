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
  const [filterTab, setFilterTab] = useState('unsold')
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const snapshot = await getDocs(collection(db, 'auctions'))
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return {
          docId: docSnap.id,
          ...data,
          sold: data.sold || false,
          pay: data.pay || false,
          finish: data.finish || false,
        }
      })
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

  const autoSave = async (docId, data) => {
    try {
      await updateDoc(doc(db, 'auctions', docId), data)
    } catch (err) {
      console.error('Auto-save failed:', err.message)
    }
  }

  const handleChange = (docId, field, value) => {
    setEditing(prev => {
      const updated = { ...prev, [docId]: { ...prev[docId], [field]: value } }
      autoSave(docId, updated[docId])
      return updated
    })
  }

  const handleDelete = async docId => {
    try {
      await deleteDoc(doc(db, 'auctions', docId))
      setItems(items.filter(item => item.docId !== docId))
    } catch (err) {
      console.error('Delete failed:', err.message)
    }
  }

  const toggleStatus = async (docId, item) => {
    let newStatus = {}
    if (!item.sold && !item.finish) newStatus = { sold: true, pay: false }
    else if (item.sold && !item.pay && !item.finish) newStatus = { pay: true }
    else if (item.sold && item.pay && !item.finish) newStatus = { finish: true }
    else newStatus = { sold: false, pay: false, finish: false }
    try {
      await updateDoc(doc(db, 'auctions', docId), newStatus)
      setItems(prev => prev.map(it => it.docId === docId ? { ...it, ...newStatus } : it))
    } catch (err) {
      console.error('Failed to update status:', err.message)
    }
  }

  const filteredItems = items.filter(item => {
    const keyword = search.toLowerCase()
    const matchKeyword = (
      item.title?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.remark?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.barcode?.toLowerCase().includes(keyword) ||
      item.id?.toLowerCase().includes(keyword)
    )

    const matchStatus =
      (filterTab === 'unsold' && !item.sold && !item.finish) ||
      (filterTab === 'sold_unpay' && item.sold && !item.pay && !item.finish) ||
      (filterTab === 'sold_paid' && item.sold && item.pay && !item.finish) ||
      (filterTab === 'finished' && item.finish) ||
      (filterTab === 'all')

    return matchKeyword && matchStatus
  })

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Yahoo Auction List</h1>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search title / remark / barcode / ID"
        className="border px-4 py-2 mb-4 w-full max-w-md"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'unsold', label: '未售出' },
          { key: 'sold_unpay', label: '已售出未付款' },
          { key: 'sold_paid', label: '已售出已付款' },
          { key: 'finished', label: '已完成' },
          { key: 'all', label: '全部' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-3 py-1 rounded-full ${filterTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.docId} className="border p-3 rounded-lg relative bg-white shadow hover:shadow-md">
            <button onClick={() => toggleStatus(item.docId, item)} className="absolute top-2 left-2 text-xl">
              {item.finish ? '✅' : item.sold ? (item.pay ? '💰' : '🛒') : '⭕'}
            </button>
            <img
              src={editing[item.docId]?.image || ''}
              alt={item.title}
              className="w-full h-[160px] object-contain rounded-md border cursor-pointer"
              onClick={() => setPopupImage(editing[item.docId]?.image2)}
            />
            <div className="text-center font-bold text-lg mt-2">{editing[item.docId]?.uid}</div>
            <div className="text-center text-gray-600 text-sm truncate">{item.title}</div>
          </div>
        ))}
      </div>

      {popupImage && (
        <div
          onClick={() => setPopupImage(null)}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        >
          <img src={popupImage} alt="Popup" className="max-w-[90%] max-h-[90%] object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}
