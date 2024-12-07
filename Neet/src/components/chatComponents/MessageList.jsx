import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import PropTypes from "prop-types";

const MessageList = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Automatyczne przewijanie do ostatniej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-800 p-4">
      {messages.length === 0 ? (
        <p className="text-gray-400">Brak wiadomości</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 p-2 rounded ${
              message.senderId === auth.currentUser.uid
                ? "text-right"
                : "text-left"
            }`}
          >
            <p
              className={`inline-block px-3 py-2 rounded-lg ${
                message.senderId === auth.currentUser.uid
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

MessageList.propTypes = {
  conversationId: PropTypes.string.isRequired, // ID wybranej konwersacji
};

export default MessageList;
