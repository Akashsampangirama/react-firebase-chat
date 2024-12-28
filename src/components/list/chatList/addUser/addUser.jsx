import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username").trim();

    if (!username) {
      setError("Please enter a username.");
      return;
    }

    setLoading(true);
    setError(null); // Reset error state

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
      } else {
        setError("User not found.");
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching for the user.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      // Create a new chat document
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Prepare user chat documents
      const userChatDocRef = doc(userChatsRef, user.id);
      const currentUserChatDocRef = doc(userChatsRef, currentUser.id);

      // Create the document if it doesn't exist
      const userChatDoc = await getDoc(userChatDocRef);
      if (!userChatDoc.exists()) {
        await setDoc(userChatDocRef, { chats: [] });
      }

      const currentUserChatDoc = await getDoc(currentUserChatDocRef);
      if (!currentUserChatDoc.exists()) {
        await setDoc(currentUserChatDocRef, { chats: [] });
      }

      // Update the chat arrays for both users
      await updateDoc(userChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(currentUserChatDocRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      // Optionally clear user state or show success message
      setUser(null);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.log(err);
      setError("An error occurred while adding the user.");
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button disabled={loading}>Search</button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;