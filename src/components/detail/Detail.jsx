import React, { useState, useEffect } from "react";
import "./detail.css";
import { db, storage, auth } from "../../lib/firebase";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";

const Detail = ({ currentUser }) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [likes, setLikes] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(postsQuery);

      const posts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFeed(posts);
    };

    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!file && !caption) return;

    let imageUrl = "";

    if (file) {
      const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    const newPost = {
      caption,
      imageUrl,
      createdBy: currentUser.displayName || "Anonymous",
      createdAt: Date.now(),
    };

    await addDoc(collection(db, "posts"), newPost);
    setCaption("");
    setFile(null);

    setFeed((prev) => [newPost, ...prev]);
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      console.log("User logged out");
    });
  };

  const handleComment = (postId) => {
    if (!commentText[postId]) return;

    const newComment = {
      text: commentText[postId],
      createdAt: new Date().toLocaleString(),
    };

    setComments((prevComments) => ({
      ...prevComments,
      [postId]: [...(prevComments[postId] || []), newComment],
    }));

    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleLike = (postId) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: !prevLikes[postId],
    }));
  };

  return (
    <div className="detail">
      <div className="actions">
        <button className="logout" onClick={handleLogout}>Log Out</button>
      </div>

      <div className="createPost">
        <textarea
          placeholder="What's on your mind?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handlePost} disabled={!caption && !file}>Post</button>
      </div>

      <div className="feed">
        {feed.map((post) => (
          <div className="post" key={post.id}>
            {post.imageUrl && <img src={post.imageUrl} alt="Post" />}
            <div className="content">
              <strong>{post.createdBy}</strong>
              <p>{post.caption}</p>
              <div className="actions">
                <button className="like-button" onClick={() => handleLike(post.id)}>
                  👍 {likes[post.id] ? 'Liked' : 'Like'}
                </button>
              </div>
              <div className="comment-section">
                <div className="comments-list">
                  {comments[post.id]?.map((comment, index) => (
                    <div className="comment-item" key={index}>
                      {comment.text} <span className="timestamp">{comment.createdAt}</span>
                    </div>
                  ))}
                </div>
                <div className="comment-input">
                  <input
                    type="text"
                    value={commentText[post.id] || ""}
                    onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                    placeholder="Add a comment..."
                  />
                  <button onClick={() => handleComment(post.id)}>Comment</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Detail;

