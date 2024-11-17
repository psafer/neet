import { useState, useEffect } from "react";
import PropTypes from "prop-types"; // Dodanie PropTypes dla walidacji props
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";

const ChatPanel = ({ isOpen, toggleChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const userId = auth.currentUser.uid;

  useEffect(() => {
    const messagesRef = collection(db, "chats");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    await addDoc(collection(db, "chats"), {
      content: newMessage,
      senderId: userId,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  return (
    <div
      className={`fixed bottom-0 right-0 w-full sm:w-1/3 md:w-1/4 bg-gray-800 p-4 shadow-lg transition-transform transform ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ maxHeight: "60vh" }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white">Chat</h3>
        <button onClick={toggleChat} className="text-white">
          X
        </button>
      </div>
      <div className="chat-messages overflow-y-auto h-48 mb-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-1 ${
              msg.senderId === userId ? "text-right" : "text-left"
            }`}
          >
            <p className="text-white text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Napisz wiadomość..."
          className="flex-1 p-2 bg-gray-700 text-white rounded-l-lg outline-none"
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-orange-500 text-white rounded-r-lg"
        >
          Wyślij
        </button>
      </div>
    </div>
  );
};

// Dodanie walidacji PropTypes
ChatPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleChat: PropTypes.func.isRequired,
};

export default ChatPanel;
