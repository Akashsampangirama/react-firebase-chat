import React from "react";
import "./post.css";

const Post = ({ post, onComment, onLike }) => {
  return (
    <div className="post">
      {post.imageUrl && <img src={post.imageUrl} alt={post.caption} />}
      <h3>{post.caption}</h3>
      <div className="post-actions">
        <button onClick={() => onLike(post.id)}>Like</button>
        <button onClick={() => onComment(post.id)}>Comment</button>
      </div>
      <div className="likes-count">{post.likes.length} likes</div>
      {/* Render comments */}
      {post.comments.map(comment => (
        <div key={comment.id} className="comment">
          <strong>{comment.username}</strong>: {comment.text}
        </div>
      ))}
    </div>
  );
};

export default Post;
