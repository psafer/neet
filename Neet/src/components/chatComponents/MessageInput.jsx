import { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

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

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setMessage((prev) => prev + emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // Zamykaj emoji picker, gdy klikniesz poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex items-center bg-gray-700 p-2 relative">
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Napisz wiadomość..."
        className="flex-1 bg-gray-800 text-white px-1 py-2 rounded-l-lg outline-none"
      />
      <button
        onClick={toggleEmojiPicker}
        className="bg-gray-800 text-yellow-400 px-2 py-2 hover:bg-gray-800 transition"
      >
        <i className="fa-solid fa-smile text-orange-500"></i>
      </button>
      <button
        onClick={handleSendMessage}
        className="bg-blue-500 text-white px-3 py-2 rounded-r-lg hover:bg-blue-600 transition"
      >
        <i className="fa-solid fa-paper-plane"></i>
      </button>

      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-12 right-2 bg-gray-800 p-2 rounded shadow-lg z-50"
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

MessageInput.propTypes = {
  conversationId: PropTypes.string.isRequired, // ID wybranej konwersacji
};

export default MessageInput;
