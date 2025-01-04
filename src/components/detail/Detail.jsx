import React, { useState, useEffect } from "react";
import { db, auth, storage } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./detail.css";
import ChatList from './ChatList';
import MapComponent from './Maps/MapComponent';

const Detail = ({ currentUser, userLocation }) => {
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [feed, setFeed] = useState([]);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [likes, setLikes] = useState({});
  const [dislikes, setDislikes] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const radius = 5000; // Radius in meters

  useEffect(() => {
    const unSub = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc")),
      (querySnapshot) => {
        const posts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter posts based on user location
        const filteredPosts = posts.filter((post) => {
          const postLocation = {
            latitude: post.latitude,
            longitude: post.longitude,
          };
          return calculateDistance(userLocation, postLocation) <= radius;
        });

        setFeed(filteredPosts);
        setIsLoading(false); // Set loading to false once feed is set

        const commentsData = {};
        const likesData = {};
        const dislikesData = {};

        filteredPosts.forEach((post) => {
          commentsData[post.id] = post.comments || [];
          likesData[post.id] = post.likes || [];
          dislikesData[post.id] = post.dislikes || [];
        });

        setComments(commentsData);
        setLikes(likesData);
        setDislikes(dislikesData);
      }
    );

    return () => unSub();
  }, [userLocation]);

  const calculateDistance = (loc1, loc2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371e3; // Radius of Earth in meters
    const lat1 = toRad(loc1.lat);
    const lat2 = toRad(loc2.latitude);
    const deltaLat = toRad(loc2.latitude - loc1.lat);
    const deltaLng = toRad(loc2.longitude - loc1.lng);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

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
        longitude: userLocation?.lng || null,
        latitude: userLocation?.lat || null,
      };

      await addDoc(collection(db, "posts"), newPost);
      resetPostForm();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  const resetPostForm = () => {
    setCaption("");
    setFiles([]);
    setImagePreviews([]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
      setMapLoaded(false);
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
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
        {!isLoading && <ChatList currentUser={currentUser} />}
        <MapComponent initialLocation={{ lat: 12.9938623, lng: 77.7190971 }} />
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
                      <button onClick={() => handleComment(post.id)}>Send</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
