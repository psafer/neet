import { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState(""); // Treść wiadomości
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Pokazywanie Emoji Picker
  const emojiPickerRef = useRef(null); // Referencja do Emoji Picker
  const typingRef = useRef(null); // Referencja do timeoutu "pisze..."

  const handleInputChange = async (e) => {
    setMessage(e.target.value);

    // Ustawienie wskaźnika "pisze..."
    try {
      const typingIndicatorRef = doc(
        db,
        "conversations",
        conversationId,
        "typing",
        auth.currentUser.uid
      );
      await setDoc(typingIndicatorRef, { isTyping: true });

      // Reset wskaźnika po 2 sekundach braku aktywności
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(async () => {
        await deleteDoc(typingIndicatorRef); // Usunięcie wskaźnika
      }, 2000);
    } catch (error) {
      console.error("Błąd przy ustawianiu wskaźnika pisania:", error);
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

      // Dodanie wiadomości do kolekcji
      await addDoc(messagesRef, {
        content: message.trim(),
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setMessage(""); // Czyszczenie inputa po wysłaniu wiadomości

      // Usunięcie wskaźnika "pisze..." po wysłaniu wiadomości
      const typingIndicatorRef = doc(
        db,
        "conversations",
        conversationId,
        "typing",
        auth.currentUser.uid
      );
      await deleteDoc(typingIndicatorRef);
    } catch (error) {
      console.error("Błąd podczas wysyłania wiadomości:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSendMessage(); // Wysyłanie wiadomości po Enter
    }
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setMessage((prev) => prev + emoji); // Dodanie emoji do wiadomości
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // Zamykaj Emoji Picker, gdy klikniesz poza nim
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
  conversationId: PropTypes.string.isRequired, // ID konwersacji
};

export default MessageInput;
