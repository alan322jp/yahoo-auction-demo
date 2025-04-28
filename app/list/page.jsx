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
  const [popupImage, setPopupImage] = useState(null)
  const [search, setSearch] = useState('')
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
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
          sold: data.sold || false,
          finish: data.finish || false,
        }
      })
      const sortedList = list.sort((a, b) => (a.finish === b.finish ? 0 : a.finish ? 1 : -1))
      setItems(sortedList)

      const edits = {}
      const checks = {}
      sortedList.forEach(item => {
        edits[item.docId] = {
          remark: item.remark || '',
          barcode: item.barcode || '',
          note: item.note || '',
          image: item.image || '',
          image2: item.image2 || '',
          uid: item.uid || item.docId,
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

  const handleImageChange = async (docId, event, field) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      let base64 = reader.result
      handleChange(docId, field, base64)
    }
    reader.readAsDataURL(file)
  }

  const toggleStatus = async (docId, item) => {
    let newStatus = {}
    if (!item.sold && !item.finish) newStatus = { sold: true }
    else if (item.sold && !item.finish) newStatus = { finish: true }
    else newStatus = { sold: false, finish: false }
    try {
      await updateDoc(doc(db, 'auctions', docId), newStatus)
      setItems(prev => prev.map(it => it.docId === docId ? { ...it, ...newStatus } : it))
    } catch (err) {
      console.error('❌ Failed to update status:', err.message)
    }
  }

  const handleGoToFinished = () => {
    router.push('/finished')
  }

  const filteredItems = items.filter(item => {
    const keyword = search.toLowerCase()
    const matchKeyword = (
      item.title?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.remark?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.barcode?.toLowerCase().includes(keyword)
    )
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'sold' && item.sold && !item.finish)
      || (filterStatus === 'finish' && item.finish)
    return matchKeyword && matchStatus
  })

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Yahoo Auction Item List</h1>
<div className="mb-4">
  <input
    type="text"
    placeholder="Search title / remark / barcode"
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="w-full max-w-md border border-gray-300 rounded px-4 py-2 shadow-sm"
  />
</div>
      <div className="flex flex-wrap gap-4 mb-6">
        {['all', 'sold', 'finish'].map(tab => (
          <button
            key={tab}
            className={px-4 py-2 rounded-full text-sm font-medium ${filterStatus === tab ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}}
            onClick={() => setFilterStatus(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => {
          const colorClass = item.finish ? 'bg-yellow-100 border-yellow-400' : item.sold ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200'
          return (
            <div
              key={item.docId}
              className={rounded-md border ${colorClass} hover:shadow-md transition-all duration-150 p-3 text-sm flex flex-col gap-2 relative}
            >
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  className="mr-1"
                  onChange={() => toggleStatus(item.docId, item)}
                />
                <span className="text-xs">{item.finish ? 'Finish' : item.sold ? 'Sold' : 'Mark'}</span>
              </div>

              <img
                src={editing[item.docId]?.image || ''}
                alt={item.title}
                className="w-full h-[180px] object-contain rounded-md cursor-pointer border"
                onClick={() => {
                  const image2 = editing[item.docId]?.image2
                  if (image2) setPopupImage(image2)
                }}
              />

              <div className="text-lg font-bold text-gray-800 text-center">
                {editing[item.docId]?.uid || item.docId}
              </div>

              <div className="flex gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                  📎<input type="file" className="hidden" onChange={e => handleImageChange(item.docId, e, 'image')} />Main
                </label>
                <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                  🖼️<input type="file" className="hidden" onChange={e => handleImageChange(item.docId, e, 'image2')} />Code
                </label>
              </div>

              <h4 className="font-medium leading-snug text-gray-900 truncate mt-1">{item.title}</h4>
              <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate">
                {item.id}
              </a>

              <input
                type="text"
                placeholder="Remark"
                value={editing[item.docId]?.remark || ''}
                onChange={e => handleChange(item.docId, 'remark', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Bar code"
                value={editing[item.docId]?.barcode || ''}
                onChange={e => handleChange(item.docId, 'barcode', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="Note"
                value={editing[item.docId]?.note || ''}
                onChange={e => handleChange(item.docId, 'note', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
              />

              <button
                onClick={() => handleDelete(item.docId)}
                className="text-red-600 text-xs hover:underline mt-1 self-end"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>

      {popupImage && (
        <div
          onClick={() => setPopupImage(null)}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        >
          <img src={popupImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg object-contain" />
        </div>
      )}
    </div>
  )
}