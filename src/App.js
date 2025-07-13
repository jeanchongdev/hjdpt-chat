"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import CommentSection from "./components/CommentSection"
import AuthModal from "./components/AuthModal"
import Header from "./components/Header"
import "./App.css"

// Configuración de Firebase (reemplaza con tu configuración)
const firebaseConfig = {
  apiKey: "AIzaSyDf996a8JjGpQZwcDhXpxQj_QafDOCFDSQ",
  authDomain: "discucion-7161a.firebaseapp.com",
  projectId: "discucion-7161a",
  storageBucket: "discucion-7161a.firebasestorage.app",
  messagingSenderId: "282411386026",
  appId: "1:282411386026:web:74d3aed51fbf54b9d7fcd3",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState("dark")

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className={`app ${theme}`}>
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        theme={theme}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <main className="main-content">
        <CommentSection user={user} />
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}

export default App
