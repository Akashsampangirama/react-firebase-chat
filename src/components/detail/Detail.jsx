import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./detail.css";
import ChatList from './ChatList';
import OnlineUsers from './OnlineUsers'

const Detail = ({ currentUser }) => {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [feed, setFeed] = useState([]);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [likes, setLikes] = useState({});
  const [dislikes, setDislikes] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const unSub = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (querySnapshot) => {
      const posts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFeed(posts);

      const commentsData = {};
      const likesData = {};
      const dislikesData = {};

      posts.forEach((post) => {
        commentsData[post.id] = post.comments || [];
        likesData[post.id] = post.likes || [];
        dislikesData[post.id] = post.dislikes || [];
      });

      setComments(commentsData);
      setLikes(likesData);
      setDislikes(dislikesData);
    });

    return () => unSub();
  }, []);

  const handlePost = async () => {
    if (!caption && files.length === 0) return;

    const imageUrls = [];
    try {
      for (const file of files) {
        const storageRef = ref(storage, `images/${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        imageUrls.push(imageUrl);
      }

      const newPost = {
        caption,
        createdBy: currentUser.displayName || "Anonymous",
        createdAt: new Date().toISOString(),
        comments: [],
        likes: [],
        dislikes: [],
        imageUrls,
      };

      await addDoc(collection(db, "posts"), newPost);
      setCaption("");
      setFiles([]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      console.log("User logged out");
    });
  };

  const handleComment = async (postId) => {
    if (!commentText[postId]) return;

    try {
      const newComment = {
        text: commentText[postId],
        createdAt: new Date().toLocaleString(),
      };

      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
      });

      setComments((prevComments) => ({
        ...prevComments,
        [postId]: [...(prevComments[postId] || []), newComment],
      }));

      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  const handleReaction = async (postId, reactionType) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const postRef = doc(db, "posts", postId);
    const currentLikes = likes[postId] || [];
    const currentDislikes = dislikes[postId] || [];

    try {
      if (reactionType === "like") {
        if (currentLikes.includes(currentUserId)) {
          await updateDoc(postRef, {
            likes: currentLikes.filter((userId) => userId !== currentUserId),
          });
        } else {
          await updateDoc(postRef, {
            dislikes: currentDislikes.filter((userId) => userId !== currentUserId),
            likes: arrayUnion(currentUserId),
          });
        }
      } else if (reactionType === "dislike") {
        if (currentDislikes.includes(currentUserId)) {
          await updateDoc(postRef, {
            dislikes: currentDislikes.filter((userId) => userId !== currentUserId),
          });
        } else {
          await updateDoc(postRef, {
            likes: currentLikes.filter((userId) => userId !== currentUserId),
            dislikes: arrayUnion(currentUserId),
          });
        }
      }

      setLikes((prevLikes) => ({
        ...prevLikes,
        [postId]: reactionType === "like"
          ? currentLikes.includes(currentUserId)
            ? currentLikes.filter((userId) => userId !== currentUserId)
            : [...currentLikes, currentUserId]
          : currentLikes.filter((userId) => userId !== currentUserId),
      }));

      setDislikes((prevDislikes) => ({
        ...prevDislikes,
        [postId]: reactionType === "dislike"
          ? currentDislikes.includes(currentUserId)
            ? currentDislikes.filter((userId) => userId !== currentUserId)
            : [...currentDislikes, currentUserId]
          : currentDislikes.filter((userId) => userId !== currentUserId),
      }));
    } catch (error) {
      console.error(`Error updating ${reactionType} reaction:`, error);
      alert(`Failed to update ${reactionType}. Please try again.`);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    const fileURLs = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(fileURLs);
  };

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="detail">
      <div className="sidebar">
        <h2>Online Users</h2>
        <ChatList />
      </div>

      <div className="main-content">
        <div className="actions">
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>

        <div className="createPost">
          <textarea
            placeholder="What's on your mind?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <label htmlFor="file-upload" className="upload-btn">Upload Images</label>
          <input
            type="file"
            id="file-upload"
            onChange={handleFileSelect}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />

          {imagePreviews.length > 0 && (
            <div className="image-preview">
              {imagePreviews.map((preview, index) => (
                <img key={index} src={preview} alt={`Preview ${index}`} className="preview-img" onClick={() => openModal(preview)} />
              ))}
            </div>
          )}

          <button onClick={handlePost} disabled={!caption && files.length === 0}>Post</button>
        </div>

        <div className="feed">
          <div className="posts-container">
            {feed.map((post) => (
              <div className="post" key={post.id}>
                <div className="post-images">
                  {post.imageUrls && post.imageUrls.map((imageUrl, index) => (
                    <img key={index} src={imageUrl} alt={`Post ${index}`} className="post-image" onClick={() => openModal(imageUrl)} />
                  ))}
                </div>
                <div className="content">
                  <strong>{post.createdBy}</strong>
                  <p>{post.caption}</p>
                  <div className="actions">
                    <button
                      className="like-button"
                      onClick={() => handleReaction(post.id, "like")}
                    >
                      👍 {likes[post.id]?.length || 0} Like
                    </button>
                    <button
                      className="dislike-button"
                      onClick={() => handleReaction(post.id, "dislike")}
                    >
                      👎 {dislikes[post.id]?.length || 0} Dislike
                    </button>
                  </div>
                  <div className="comment-section">
                    <div className="comments-list">
                      {comments[post.id]?.map((comment, index) => (
                        <div className="comment-item" key={index}>
                          <p>{comment.text} <span className="timestamp">{comment.createdAt}</span></p>
                        </div>
                      ))}
                    </div>
                    <div className="comment-input">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      />
                      <button onClick={() => handleComment(post.id)}>Comment</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedImage && (
          <div className="modal" onClick={closeModal}>
            <div className="modal-content">
              <img src={selectedImage} alt="Selected" className="modal-image" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Detail;
