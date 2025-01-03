import React, { useState } from "react";
import "./chat.css"; // Ensure this file is created for styles

const Chat = () => {
  const [onlineUsers] = useState(["User1", "User2", "User3"]); // Placeholder for online users
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="chat-container">
      <div className="online-users">
        <h3>Online Users</h3>
        <ul>
          {onlineUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      
      <div className="chat-area">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong>{msg.user}: </strong>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button onClick={() => {
            // Add functionality to send messages later
            setMessages((prev) => [...prev, { user: "You", text: newMessage }]);
            setNewMessage("");
          }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
