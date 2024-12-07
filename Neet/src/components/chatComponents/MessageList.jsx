import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import PropTypes from "prop-types";

const MessageList = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    // Pobranie wiadomości
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

  useEffect(() => {
    if (!conversationId) return;

    // Pobranie uczestników konwersacji i ich zdjęć profilowych
    const fetchParticipants = async () => {
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);

      if (conversationSnap.exists()) {
        const participantsIds = conversationSnap.data().participants;
        const participantsData = {};

        for (const userId of participantsIds) {
          const profileRef = doc(db, "profiles", userId);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            participantsData[userId] = {
              profilePicture:
                profileSnap.data().profilePicture || "/default-profile.png",
            };
          }
        }
        setParticipants(participantsData);
      }
    };

    fetchParticipants();
  }, [conversationId]);

  // Automatyczne przewijanie do ostatniej wiadomości
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Funkcja do formatowania czasu
  const formatTimestamp = (timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();

    // Sprawdź, czy wiadomość została wysłana dzisiaj
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-800 p-4">
      {messages.length === 0 ? (
        <p className="text-gray-400">Brak wiadomości</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex flex-col ${
              message.senderId === auth.currentUser.uid
                ? "items-end"
                : "items-start"
            }`}
          >
            {/* Czas wysłania wiadomości */}
            <p
              className={`text-xs mb-1 ${
                message.senderId === auth.currentUser.uid
                  ? "text-gray-400 text-right mr-7"
                  : "text-gray-400 text-left ml-7"
              }`}
            >
              {message.timestamp ? formatTimestamp(message.timestamp) : ""}
            </p>

            <div className="flex items-center">
              {/* Zdjęcie profilowe */}
              {message.senderId !== auth.currentUser.uid && (
                <img
                  src={participants[message.senderId]?.profilePicture}
                  alt="Profile"
                  className="w-4 h-4 rounded-full mr-2 mt-3"
                />
              )}
              <p
                className={`inline-block px-3 py-1 rounded-lg max-w-xs ${
                  message.senderId === auth.currentUser.uid
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-white"
                }`}
              >
                {message.content}
              </p>
              {/* Zdjęcie profilowe dla moich wiadomości */}
              {message.senderId === auth.currentUser.uid && (
                <img
                  src={participants[message.senderId]?.profilePicture}
                  alt="Profile"
                  className="w-4 h-4 rounded-full ml-2 mt-3"
                />
              )}
            </div>
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
