import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import PropTypes from "prop-types";

const ConversationList = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="bg-gray-800 p-4 text-white overflow-y-auto h-full">
      {conversations.length === 0 ? (
        <p className="text-gray-400">Brak konwersacji</p>
      ) : (
        conversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(
            (uid) => uid !== currentUser.uid
          );

          return (
            <div
              key={conversation.id}
              className="p-3 bg-gray-700 mb-2 rounded hover:bg-gray-600 cursor-pointer"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <p className="font-bold">
                {conversation.lastMessageSenderName || "Nieznany Użytkownik"}
              </p>
              <p className="text-sm text-gray-400 truncate">
                {conversation.lastMessage || "Brak wiadomości"}
              </p>
              <p className="text-xs text-gray-500">
                {conversation.lastMessageTimestamp
                  ? new Date(
                      conversation.lastMessageTimestamp.seconds * 1000
                    ).toLocaleString()
                  : ""}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
};

ConversationList.propTypes = {
  onSelectConversation: PropTypes.func.isRequired, // Funkcja do wyboru rozmowy
};

export default ConversationList;
