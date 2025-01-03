import { useEffect, useState } from "react";
import { db } from "../../lib/firebase"; // Adjust the import according to your structure
import { collection, onSnapshot } from "firebase/firestore";
import { useUserStore } from "../../lib/userStore"; // Import your user store
import "./onlineUsers.css"; // Add your styles

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser } = useUserStore(); // Get current user from Zustand store

  useEffect(() => {
    const unSub = onSnapshot(collection(db, "users"), (snapshot) => {
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Filter out the current user
      const filteredUsers = users.filter(user => user.id !== currentUser?.id && user.isOnline);

      setOnlineUsers(filteredUsers);
    });

    return () => unSub(); // Cleanup the listener on unmount
  }, [currentUser]); // Depend on currentUser to re-fetch when it changes

  return (
    <div className="onlineUsers">
      <ul>
        {onlineUsers.map((user) => (
          <li key={user.id} className="user">
            <img src={user.avatar || "./avatar.png"} alt={user.username} />
            <span className="username">{user.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsers;
