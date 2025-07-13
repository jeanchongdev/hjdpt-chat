"use client"
import { useState, useEffect } from "react"
import {
  Heart,
  MessageCircle,
  Share2,
  User,
  ChevronDown,
  ChevronUp,
  Smile,
  Frown,
  SmileIcon as Surprise,
} from "lucide-react"
import { doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore"
import { db } from "../App"
import { formatDistanceToNow } from "date-fns"
import ReplyForm from "./ReplyForm"

// Función para obtener o crear un ID único del navegador
const getBrowserId = () => {
  let browserId = localStorage.getItem("browserId")
  if (!browserId) {
    browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("browserId", browserId)
  }
  return browserId
}

const Comment = ({ comment, user, level = 0, parentId = null, replyIndex = null }) => {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [commentData, setCommentData] = useState(comment)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (comment.id && !comment.id.includes("reply")) {
      const unsubscribe = onSnapshot(doc(db, "comments", comment.id), (doc) => {
        if (doc.exists()) {
          setCommentData({ id: doc.id, ...doc.data() })
        }
      })
      return () => unsubscribe()
    }
  }, [comment.id])

  const reactions = [
    { type: "like", icon: Heart, label: "Like" },
    { type: "love", icon: Heart, label: "Love", color: "#e91e63" },
    { type: "funny", icon: Smile, label: "Funny", color: "#ffc107" },
    { type: "angry", icon: Frown, label: "Angry", color: "#f44336" },
    { type: "wow", icon: Surprise, label: "Wow", color: "#2196f3" },
  ]

  // Función mejorada para verificar autoría
  const isAuthor = () => {
    if (!commentData) return false

    // Si hay usuario logueado y el comentario no es anónimo
    if (user && !commentData.isAnonymous && commentData.author?.uid === user.uid) {
      return true
    }

    // Para comentarios anónimos, verificar browserId
    if (commentData.isAnonymous && commentData.browserId) {
      const currentBrowserId = getBrowserId()
      return commentData.browserId === currentBrowserId
    }

    return false
  }

  const handleReaction = async (reactionType) => {
    try {
      const userId = user?.uid || getBrowserId()
      if (level === 0) {
        // Comentario principal
        const commentRef = doc(db, "comments", comment.id)
        const currentReactions = commentData.reactions || {}
        const userReactions = currentReactions[reactionType] || []
        const hasReacted = userReactions.includes(userId)
        const updatedReactions = {
          ...currentReactions,
          [reactionType]: hasReacted ? userReactions.filter((id) => id !== userId) : [...userReactions, userId],
        }
        await updateDoc(commentRef, {
          reactions: updatedReactions,
        })
      } else {
        // Es una respuesta - actualizar en el comentario padre
        const parentRef = doc(db, "comments", parentId)
        const parentDoc = await getDoc(parentRef)
        if (parentDoc.exists()) {
          const parentData = parentDoc.data()
          const replies = [...(parentData.replies || [])]
          if (replies[replyIndex]) {
            const currentReactions = replies[replyIndex].reactions || {}
            const userReactions = currentReactions[reactionType] || []
            const hasReacted = userReactions.includes(userId)
            replies[replyIndex].reactions = {
              ...currentReactions,
              [reactionType]: hasReacted ? userReactions.filter((id) => id !== userId) : [...userReactions, userId],
            }
            await updateDoc(parentRef, { replies })
          }
        }
      }
      setShowReactions(false)
    } catch (error) {
      console.error("Error updating reaction:", error)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return
    try {
      if (level === 0) {
        // Comentario principal
        const commentRef = doc(db, "comments", comment.id)
        await updateDoc(commentRef, {
          content: editContent.trim(),
          isEdited: true,
          editedAt: new Date(),
        })
      } else {
        // Es una respuesta
        const parentRef = doc(db, "comments", parentId)
        const parentDoc = await getDoc(parentRef)
        if (parentDoc.exists()) {
          const parentData = parentDoc.data()
          const replies = [...(parentData.replies || [])]
          if (replies[replyIndex]) {
            replies[replyIndex].content = editContent.trim()
            replies[replyIndex].isEdited = true
            replies[replyIndex].editedAt = new Date()
            await updateDoc(parentRef, { replies })
          }
        }
      }
      setIsEditing(false)
    } catch (error) {
      console.error("Error editing comment:", error)
    }
  }

  const handleDelete = async () => {
    try {
      if (level === 0) {
        // Comentario principal
        const commentRef = doc(db, "comments", comment.id)
        await updateDoc(commentRef, {
          isDeleted: true,
          content: "Deleted",
          deletedAt: new Date(),
        })
      } else {
        // Es una respuesta
        const parentRef = doc(db, "comments", parentId)
        const parentDoc = await getDoc(parentRef)
        if (parentDoc.exists()) {
          const parentData = parentDoc.data()
          const replies = [...(parentData.replies || [])]
          if (replies[replyIndex]) {
            replies[replyIndex].isDeleted = true
            replies[replyIndex].content = "Deleted"
            replies[replyIndex].deletedAt = new Date()
            await updateDoc(parentRef, { replies })
          }
        }
      }
      setShowMenu(false)
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Discuzz Comment",
        text: commentData.content,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const getTimeAgo = () => {
    if (!commentData.createdAt) return "just now"
    const date = commentData.createdAt.toDate ? commentData.createdAt.toDate() : new Date(commentData.createdAt)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const getReactionCounts = () => {
    if (!commentData.reactions) return {}
    const counts = {}
    Object.entries(commentData.reactions).forEach(([type, users]) => {
      if (users.length > 0) {
        counts[type] = users.length
      }
    })
    return counts
  }

  const getTotalReactions = () => {
    if (!commentData.reactions) return 0
    return Object.values(commentData.reactions).reduce((total, users) => total + users.length, 0)
  }

  const getTopReaction = () => {
    if (!commentData.reactions) return null
    let maxCount = 0
    let topReaction = null
    Object.entries(commentData.reactions).forEach(([type, users]) => {
      if (users.length > maxCount) {
        maxCount = users.length
        topReaction = type
      }
    })
    return topReaction
  }

  const repliesCount = commentData.replies?.length || 0

  // Si el comentario está eliminado, mostrar solo el mensaje de eliminación
  if (commentData.isDeleted) {
    return (
      <div className={`comment deleted-comment ${level > 0 ? "reply-comment" : ""}`} style={{ marginLeft: level * 20 }}>
        <div className="comment-header">
          <div className="comment-author">
            <div className="author-avatar">
              <User className="avatar-icon" />
            </div>
            <div className="author-info">
              <span className="author-name">
                {commentData.isAnonymous ? "Anonymous" : commentData.author?.displayName || "Anonymous"}
              </span>
              <span className="comment-time">({getTimeAgo()})</span>
            </div>
          </div>
        </div>
        <div className="comment-content">
          <span className="deleted-content">
            Deleted {commentData.deletedAt && formatDistanceToNow(commentData.deletedAt.toDate(), { addSuffix: true })}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`comment ${level > 0 ? "reply-comment" : ""}`} style={{ marginLeft: level * 20 }}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            <User className="avatar-icon" />
          </div>
          <div className="author-info">
            <span className="author-name">
              {commentData.isAnonymous ? "Anonymous" : commentData.author?.displayName || "Anonymous"}
            </span>
            <span className="comment-time">({getTimeAgo()})</span>
            {commentData.isEdited && <span className="edited-badge">edited</span>}
          </div>
        </div>
        {/* Mostrar menú solo si es el autor */}
        {isAuthor() && (
          <div className="comment-actions-menu">
            <button className="menu-trigger" onClick={() => setShowMenu(!showMenu)}>
              <ChevronDown className={`menu-icon ${showMenu ? "rotated" : ""}`} />
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={() => setIsEditing(true)} className="menu-item">
                  Edit
                </button>
                <button onClick={handleDelete} className="menu-item delete">
                  Delete
                </button>
                <button onClick={handleShare} className="menu-item">
                  Share
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="edit-form">
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="edit-input" />
            <div className="edit-actions">
              <button onClick={() => setIsEditing(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleEdit} className="save-btn">
                Save
              </button>
            </div>
          </div>
        ) : (
          commentData.content
        )}
      </div>

      <div className="comment-actions">
        <div className="comment-actions-row">
          <div className="reaction-container">
            <button className="action-btn reaction-btn" onClick={() => setShowReactions(!showReactions)}>
              <Heart className="action-icon" />
              <span>REACT</span>
            </button>
            {showReactions && (
              <div className="reactions-popup">
                {reactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    className="reaction-option"
                    onClick={() => handleReaction(reaction.type)}
                    title={reaction.label}
                  >
                    <reaction.icon size={20} style={{ color: reaction.color || "currentColor" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="action-btn reply-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
            <MessageCircle className="action-icon" />
            <span>REPLY</span>
          </button>

          {/* Solo mostrar toggle de respuestas en comentarios principales (level 0) */}
          {level === 0 && repliesCount > 0 && (
            <button className="action-btn replies-toggle" onClick={() => setShowReplies(!showReplies)}>
              {showReplies ? <ChevronUp className="action-icon" /> : <ChevronDown className="action-icon" />}
              <span>{showReplies ? "HIDE" : "SHOW"} REPLIES</span>
              <span className="replies-count">{repliesCount}</span>
            </button>
          )}

          <button className="action-btn share-btn" onClick={handleShare}>
            <Share2 className="action-icon" />
            <span>SHARE</span>
          </button>
        </div>

        {/* Mostrar contadores de reacciones */}
        {getTotalReactions() > 0 && (
          <div className="reactions-display">
            {Object.entries(getReactionCounts()).map(([type, count]) => {
              const reaction = reactions.find((r) => r.type === type)
              return (
                <div key={type} className="reaction-count" onClick={() => handleReaction(type)}>
                  {reaction && <reaction.icon size={16} style={{ color: reaction.color || "currentColor" }} />}
                  <span>{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showReplyForm && (
        <ReplyForm
          commentId={level === 0 ? comment.id : parentId}
          user={user}
          onClose={() => setShowReplyForm(false)}
        />
      )}

      {/* Solo mostrar respuestas en comentarios principales (level 0) */}
      {level === 0 && showReplies && commentData.replies && commentData.replies.length > 0 && (
        <div className="replies-section">
          {commentData.replies.map((reply, index) => (
            <Comment
              key={`${comment.id}-reply-${index}`}
              comment={{
                ...reply,
                id: `${comment.id}-reply-${index}`,
              }}
              user={user}
              level={1}
              parentId={comment.id}
              replyIndex={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Comment
