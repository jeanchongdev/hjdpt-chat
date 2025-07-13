"use client"
import { useState, useEffect, useRef } from "react"
import { collection, addDoc, onSnapshot, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore"
import { db } from "../App"
import CommentForm from "./CommentForm"
import Comment from "./Comment"

// Función para obtener o crear un ID único del navegador
const getBrowserId = () => {
  let browserId = localStorage.getItem("browserId")
  if (!browserId) {
    browserId = `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("browserId", browserId)
  }
  return browserId
}

const CommentSection = ({ user }) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState(null)
  const observerRef = useRef()
  const COMMENTS_PER_PAGE = 10

  useEffect(() => {
    loadInitialComments()
  }, [])

  const loadInitialComments = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "comments"), orderBy("createdAt", "desc"), limit(COMMENTS_PER_PAGE))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newComments = []
        snapshot.forEach((doc) => {
          newComments.push({ id: doc.id, ...doc.data() })
        })
        setComments(newComments)
        setLastDoc(snapshot.docs[snapshot.docs.length - 1])
        setHasMore(snapshot.docs.length === COMMENTS_PER_PAGE)
        setLoading(false)
      })
      return () => unsubscribe()
    } catch (error) {
      console.error("Error loading comments:", error)
      setLoading(false)
    }
  }

  const loadMoreComments = async () => {
    if (!hasMore || loading || !lastDoc) return
    setLoading(true)
    try {
      const q = query(
        collection(db, "comments"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(COMMENTS_PER_PAGE),
      )
      const snapshot = await getDocs(q)
      const newComments = []
      snapshot.forEach((doc) => {
        newComments.push({ id: doc.id, ...doc.data() })
      })
      setComments((prev) => [...prev, ...newComments])
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      setHasMore(snapshot.docs.length === COMMENTS_PER_PAGE)
    } catch (error) {
      console.error("Error loading more comments:", error)
    }
    setLoading(false)
  }

  // Intersection Observer para carga infinita
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreComments()
        }
      },
      { threshold: 1.0 },
    )
    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    return () => observer.disconnect()
  }, [hasMore, loading, lastDoc])

  const handleNewComment = async (content, isAnonymous = false) => {
    try {
      const commentData = {
        content,
        createdAt: new Date(),
        likes: 0,
        likedBy: [],
        replies: [],
        isDeleted: false,
        isAnonymous,
        browserId: isAnonymous ? getBrowserId() : null,
        author: isAnonymous
          ? null
          : {
              uid: user?.uid || null,
              displayName: user?.displayName || "Anonymous",
              photoURL: user?.photoURL || null,
            },
      }

      await addDoc(collection(db, "comments"), commentData)
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  return (
    <div className="comment-section">
      <CommentForm onSubmit={handleNewComment} user={user} />
      <div className="comments-list">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} user={user} />
        ))}
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        {hasMore && <div ref={observerRef} className="load-trigger"></div>}
      </div>
    </div>
  )
}

export default CommentSection
