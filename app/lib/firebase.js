import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCLv1BebayVjCrAHLPn-d6waTrACU8o45o",
  authDomain: "auctiondemo-764ce.firebaseapp.com",
  projectId: "auctiondemo-764ce",
  storageBucket: "auctiondemo-764ce.firebasestorage.app",
  messagingSenderId: "341789294820",
  appId: "1:341789294820:web:ceef3652d9f7f3939a6cf1"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db }


