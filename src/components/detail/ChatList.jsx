import { useEffect, useState } from "react";
import "./chatList.css"; 
import AddUser from "../detail/addUser/addUser"; 
import { useUserStore } from "../../lib/userStore"; 
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 
import { useChatStore } from "../../lib/chatStore"; 
import OnlineUsers from "../detail/OnlineUsers"; 

const ChatList = ({ currentUser }) => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { changeChat } = useChatStore(); 

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      console.error("Current user is not defined");
      return;
    }

    const unSub = onSnapshot(doc(db, "userchats", currentUser.id), async (res) => {
      const data = res.data();
      const items = data?.chats || [];

      const promises = items.map(async (item) => {
        const userDocRef = doc(db, "users", item.receiverId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const user = userDocSnap.data();
          return { ...item, user };
        } else {
          console.error(`User not found: ${item.receiverId}`);
          return null; 
        }
      });

      const chatData = await Promise.all(promises);
      setChats(chatData.filter(chat => chat !== null).sort((a, b) => b.updatedAt - a.updatedAt));
    });

    return () => {
      unSub();
    };
  }, [currentUser]); // Ensure this runs whenever currentUser changes

  const handleSelect = async (chat) => {
    if (!currentUser) {
      console.error("Current user is not defined when selecting chat.");
      return;
    }

    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex((item) => item.chatId === chat.chatId);
    if (chatIndex !== -1) {
      userChats[chatIndex].isSeen = true;

      const userChatsRef = doc(db, "userchats", currentUser.id);
      try {
        await updateDoc(userChatsRef, { chats: userChats });
        changeChat(chat.chatId, chat.user);
      } catch (err) {
        console.error("Error updating chat:", err);
      }
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  if (!currentUser) {
    return <div className="loading">Loading chats...</div>; // Show loading state
  }

  return (
    <div className="chatList">
      <div className="search">
        <input
          type="text"
          placeholder="Search"
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={() => setAddMode((prev) => !prev)}>
          {addMode ? "Cancel" : "Add User"}
        </button>
      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img src={chat.user.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{chat.user.username}</span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}
      {addMode && <AddUser />}
      <OnlineUsers />
    </div>
  );
};

export default ChatList;
