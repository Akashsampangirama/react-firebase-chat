import { useEffect, useState } from "react";
import "./chatList.css"; // Add your styles
import AddUser from "../detail/addUser/addUser"; // Ensure this component is available
import { useUserStore } from "../../lib/userStore"; // Assuming this is your user store
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Ensure the path is correct
import { useChatStore } from "../../lib/chatStore"; // Assuming this is your chat store
import OnlineUsers from "../detail/OnlineUsers"; // Import the OnlineUsers component

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore(); // Get the current user from your store
  const { changeChat } = useChatStore(); // Function to change chat context

  useEffect(() => {
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
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
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
        console.log(err);
      }
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

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
      <OnlineUsers /> {/* Include the OnlineUsers component here */}
    </div>
  );
};

export default ChatList;
