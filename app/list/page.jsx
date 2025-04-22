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
          image2: item.image2 || '',
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

  const filteredItems = items.filter(item => {
    const keyword = search.toLowerCase()
    const matchKeyword = (
      item.title?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.remark?.toLowerCase().includes(keyword) ||
      editing[item.docId]?.barcode?.toLowerCase().includes(keyword)
    )
    const matchUnfinished = showOnlyUnfinished ? !selected[item.docId] : true
    return matchKeyword && matchUnfinished
  })

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Yahoo Auction Item List</h1>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="🔍 Search title / remark / barcode"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-md w-full md:max-w-md shadow-sm text-sm"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showOnlyUnfinished}
              onChange={() => setShowOnlyUnfinished(!showOnlyUnfinished)}
              className="mr-2"
            />
            Show only unfinished
          </label>
          <button onClick={handleGoToFinished} className="bg-yellow-400 text-black px-4 py-2 rounded-md shadow hover:bg-yellow-500 text-sm">
            📁 View Finished
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.docId}
            className={`rounded-md border border-gray-200 bg-white hover:shadow-md transition-all duration-150 p-3 text-sm flex flex-col gap-2 relative ${selected[item.docId] ? 'bg-yellow-100 border-yellow-400' : ''}`}
          >
            <div className="absolute top-2 left-2">
              <input
                type="checkbox"
                className="mr-1"
                checked={selected[item.docId] || false}
                onChange={() => toggleSelect(item.docId)}
              />
              <span className="text-xs">Finish</span>
            </div>

            {selected[item.docId] && (
              <span className="absolute top-2 right-2 bg-green-600 text-white px-2 py-0.5 rounded-full text-[10px]">Completed</span>
            )}

            <img
              src={editing[item.docId]?.image || ''}
              alt={item.title}
              className="w-full h-[180px] object-contain rounded-md cursor-pointer border"
              onClick={() => {
                const image2 = editing[item.docId]?.image2
                if (image2) setPopupImage(image2)
              }}
            />

            <div className="flex gap-2 text-xs">
              <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                📎<input type="file" className="hidden" onChange={e => handleImageChange(item.docId, e, 'image')} />Main
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-gray-600">
                🖼️<input type="file" className="hidden" onChange={e => handleImageChange(item.docId, e, 'image2')} />Code
              </label>
            </div>

            <h4 className="font-medium leading-snug text-gray-900 truncate mt-2">{item.title}</h4>
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
        ))}
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
