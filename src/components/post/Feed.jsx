import { useEffect, useState } from "react";
import { db } from "../../lib/firebase"; // Ensure Firebase is configured
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const Feed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="feed">
      {posts.map((post) => (
        <div className="post" key={post.id}>
          <img src={post.imageUrl} alt="Post" />
          <p><strong>{post.userId}</strong></p>
          <p>{post.caption}</p>
        </div>
      ))}
    </div>
  );
};

export default Feed;
