import { useState } from "react";
import { db, storage } from "../../lib/firebase"; // Ensure Firebase is configured
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const CreatePost = ({ currentUser }) => {
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handlePost = async () => {
    if (!image || !caption) return alert("Please add an image and a caption");
    setLoading(true);

    try {
      // Upload image to Firebase Storage
      const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      // Add post data to Firestore
      await addDoc(collection(db, "posts"), {
        imageUrl,
        caption,
        userId: currentUser.id,
        timestamp: Timestamp.now(),
      });

      alert("Post created successfully!");
      setImage(null);
      setCaption("");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="createPost">
      <input type="file" onChange={handleImageChange} />
      <textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button onClick={handlePost} disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
};

export default CreatePost;