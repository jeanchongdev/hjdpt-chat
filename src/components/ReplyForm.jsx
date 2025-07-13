"use client"
import { useState } from "react"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "../App"
import { User } from "lucide-react"

// Función para obtener o crear un ID único del navegador
const getBrowserId = () => {
  let browserId = localStorage.getItem("browserId")
  if (!browserId) {
    browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("browserId", browserId)
  }
  return browserId
}

const ReplyForm = ({ commentId, user, onClose }) => {
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(!user)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    try {
      const replyData = {
        content: content.trim(),
        createdAt: new Date(),
        isAnonymous,
        isDeleted: false,
        reactions: {},
        browserId: isAnonymous ? getBrowserId() : null,
        author: isAnonymous
          ? null
          : {
              uid: user?.uid || null,
              displayName: user?.displayName || "Anonymous",
              photoURL: user?.photoURL || null,
            },
      }

      const commentRef = doc(db, "comments", commentId)
      await updateDoc(commentRef, {
        replies: arrayUnion(replyData),
      })

      setContent("")
      onClose()
    } catch (error) {
      console.error("Error adding reply:", error)
      alert("Error al enviar la respuesta. Inténtalo de nuevo.")
    }
    setLoading(false)
  }

  return (
    <div className="reply-form">
      <div className="reply-form-header">
        <User className="avatar-icon small" />
        <span>{isAnonymous ? "Anonymous" : user?.displayName || "Anonymous"}</span>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          className="reply-input"
          rows={2}
          disabled={loading}
        />
        <div className="reply-actions">
          <label className="anonymous-toggle">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              disabled={loading}
            />
            Reply anonymously
          </label>
          <div className="reply-buttons">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={!content.trim() || loading}>
              {loading ? "Sending..." : "Reply"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ReplyForm
