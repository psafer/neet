import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import PropTypes from "prop-types";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      // Można wysłać wskaźnik "pisze" do Firebase (opcjonalne)
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return; // Nie wysyłaj pustych wiadomości

    try {
      const messagesRef = collection(
        db,
        "conversations",
        conversationId,
        "messages"
      );

      await addDoc(messagesRef, {
        content: message.trim(),
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setMessage("");
      setIsTyping(false);
    } catch (error) {
      console.error("Błąd podczas wysyłania wiadomości:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="flex items-center bg-gray-700 p-2">
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Napisz wiadomość..."
        className="flex-1 bg-gray-800 text-white px-1 py-2 rounded-l-lg outline-none"
      />
      <button
        onClick={handleSendMessage}
        className="bg-blue-500 text-white px-3 py-2 rounded-r-lg hover:bg-blue-600 transition"
      >
        <PaperAirplaneIcon className="w-5 h-6 transfrom -rotate-45"></PaperAirplaneIcon>
      </button>
    </div>
  );
};

MessageInput.propTypes = {
  conversationId: PropTypes.string.isRequired, // ID wybranej konwersacji
};

export default MessageInput;
