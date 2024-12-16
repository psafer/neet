import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import PropTypes from "prop-types";

// Komponent renderujący pojedynczą wiadomość
const Message = ({ message, isCurrentUser, profilePicture, timestamp }) => (
  <div
    className={`mb-4 flex flex-col ${
      isCurrentUser ? "items-end" : "items-start"
    }`}
  >
    {/* Czas wysłania wiadomości */}
    <p
      className={`text-xs mb-1 ${
        isCurrentUser ? "text-right mr-7" : "text-left ml-7"
      }`}
    >
      {timestamp}
    </p>
    <div className="flex items-center">
      {/* Zdjęcie profilowe nadawcy */}
      {!isCurrentUser && (
        <img
          src={profilePicture}
          alt="Profile"
          className="w-4 h-4 rounded-full mr-2 mt-3"
        />
      )}
      {/* Treść wiadomości */}
      <p
        className={`inline-block px-3 py-1 rounded-lg max-w-xs ${
          isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-700 text-white"
        }`}
      >
        {message}
      </p>
      {/* Zdjęcie profilowe dla własnych wiadomości */}
      {isCurrentUser && (
        <img
          src={profilePicture}
          alt="Profile"
          className="w-4 h-4 rounded-full ml-2 mt-3"
        />
      )}
    </div>
  </div>
);

Message.propTypes = {
  message: PropTypes.string.isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  profilePicture: PropTypes.string,
  timestamp: PropTypes.string.isRequired,
};

// Komponent renderujący listę wiadomości
const MessageList = ({ conversationId }) => {
  const [messages, setMessages] = useState([]); // Lista wiadomości
  const [participants, setParticipants] = useState({}); // Dane uczestników
  const [isTyping, setIsTyping] = useState(false); // Stan wskaźnika "Użytkownik pisze..."
  const messagesEndRef = useRef(null); // Referencja do ostatniej wiadomości
  const typingTimeoutRef = useRef(null); // Referencja do timeoutu resetującego "pisze..."

  useEffect(() => {
    if (!conversationId) return;

    // Pobranie wiadomości z Firebase i subskrypcja zmian w czasie rzeczywistym
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
      setMessages(msgs); // Aktualizacja listy wiadomości
    });

    return () => unsubscribe(); // Usunięcie subskrypcji przy odmontowaniu komponentu
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    // Subskrypcja stanu "Użytkownik pisze..." w czasie rzeczywistym
    const typingRef = collection(db, "conversations", conversationId, "typing");
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const isAnyoneTyping = snapshot.docs.some(
        (doc) => doc.id !== auth.currentUser.uid && doc.data().isTyping
      );
      setIsTyping(isAnyoneTyping); // Aktualizacja stanu "pisze..."

      // Reset wskaźnika po 3 sekundach bezczynności
      if (isAnyoneTyping) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(typingTimeoutRef.current); // Wyczyszczenie timeoutu przy odmontowaniu komponentu
    };
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
        setParticipants(participantsData); // Ustawienie danych uczestników
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
    <div className="flex-1 flex flex-col justify-end overflow-y-auto bg-gray-800 p-4 relative">
      {/* Sekcja wiadomości */}
      <div>
        {messages.length === 0 ? (
          <p className="text-gray-400">Brak wiadomości</p>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message.content}
              isCurrentUser={message.senderId === auth.currentUser.uid}
              profilePicture={participants[message.senderId]?.profilePicture}
              timestamp={
                message.timestamp ? formatTimestamp(message.timestamp) : ""
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Wskaźnik "Użytkownik pisze..." */}
      {isTyping && (
        <div className="text-sm text-gray-400 italic absolute bottom-2 left-4">
          Użytkownik pisze...
        </div>
      )}
    </div>
  );
};

MessageList.propTypes = {
  conversationId: PropTypes.string.isRequired, // ID wybranej konwersacji
};

export default MessageList;
