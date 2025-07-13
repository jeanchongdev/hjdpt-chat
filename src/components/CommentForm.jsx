"use client"
import { useState } from "react"
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

const CommentForm = ({ onSubmit, user }) => {
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(!user)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content.trim(), isAnonymous)
      setContent("")
    }
  }

  return (
    <div className="comment-form-container">
      <div className="comment-form-header">
        <div className="user-avatar">
          <User className="avatar-icon" />
        </div>
        <span className="username">{isAnonymous ? "Anonymous" : user?.displayName || "Anonymous"}</span>
      </div>
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something nice..."
          className="comment-input"
          rows={3}
        />
        <div className="form-actions">
          <label className="anonymous-toggle">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            Post anonymously
          </label>
          <button type="submit" className="submit-btn" disabled={!content.trim()}>
            Post
          </button>
        </div>
      </form>
    </div>
  )
}

export default CommentForm
