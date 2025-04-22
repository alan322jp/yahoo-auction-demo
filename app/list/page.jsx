
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
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Yahoo Auction Item List</h1>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search title / remark / barcode"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border px-4 py-2 rounded-md w-full md:max-w-md shadow-sm"
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
          <button onClick={handleGoToFinished} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
            View Finished Items
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div
            key={item.docId}
            className={`rounded-xl shadow p-4 border transition-all duration-150 ${selected[item.docId] ? 'bg-green-100' : 'bg-white'}`}
          >
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selected[item.docId] || false}
                  onChange={() => toggleSelect(item.docId)}
                />
                Finish
              </label>
              {selected[item.docId] && (
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Completed</span>
              )}
            </div>

            <img
              src={editing[item.docId]?.image || ''}
              alt={item.title}
              className="w-full h-auto rounded-md cursor-pointer hover:opacity-80"
              onClick={() => {
                const image2 = editing[item.docId]?.image2
                if (image2) setPopupImage(image2)
              }}
            />

            <div className="my-3 space-y-2">
              <div className="relative w-fit">
                <label className="flex items-center gap-2 cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded shadow">
                  📎 Upload Main
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => handleImageChange(item.docId, e, 'image')}
                  />
                </label>
              </div>
              <div className="relative w-fit">
                <label className="flex items-center gap-2 cursor-pointer text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded shadow">
                  🖼️ Upload Code
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => handleImageChange(item.docId, e, 'image2')}
                  />
                </label>
              </div>
            </div>

            <h4 className="text-base font-semibold text-gray-800 truncate mt-3 mb-1">{item.title}</h4>
            <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline">
              {item.id}
            </a>

            <input
              type="text"
              placeholder="Remark"
              value={editing[item.docId]?.remark || ''}
              onChange={e => handleChange(item.docId, 'remark', e.target.value)}
              className="w-full p-2 border rounded mt-2 text-sm"
            />
            <input
              type="text"
              placeholder="Bar code"
              value={editing[item.docId]?.barcode || ''}
              onChange={e => handleChange(item.docId, 'barcode', e.target.value)}
              className="w-full p-2 border rounded mt-2 text-sm"
            />
            <input
              type="text"
              placeholder="Note"
              value={editing[item.docId]?.note || ''}
              onChange={e => handleChange(item.docId, 'note', e.target.value)}
              className="w-full p-2 border rounded mt-2 text-sm"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={() => handleDelete(item.docId)}
                className="text-red-600 text-xs hover:underline"
              >
                Delete
              </button>
            </div>
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
