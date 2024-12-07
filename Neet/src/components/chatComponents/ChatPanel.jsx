import { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatPanel = () => {
  const [friends, setFriends] = useState([]); // Lista znajomych
  const [activeConversationId, setActiveConversationId] = useState(null); // Aktywna konwersacja
  const [isExpanded, setIsExpanded] = useState(false); // Stan rozwinięcia panelu

  useEffect(() => {
    // Pobieranie listy znajomych użytkownika
    const fetchFriends = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const followersRef = collection(db, "followers");
      const friendsQuery = query(
        followersRef,
        where("followerId", "==", currentUser.uid)
      );

      const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
        const friendIds = snapshot.docs.map((doc) => doc.data().followingId);

        const friendsData = await Promise.all(
          friendIds.map(async (friendId) => {
            const profileRef = doc(db, "profiles", friendId);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              return {
                id: friendId,
                name: `${profileSnap.data().firstName} ${
                  profileSnap.data().lastName
                }`,
                profilePicture:
                  profileSnap.data().profilePicture || "/mini.png",
              };
            }
            return null;
          })
        );

        setFriends(friendsData.filter((friend) => friend !== null));
      });

      return () => unsubscribe();
    };

    fetchFriends();
  }, []);

  const togglePanel = () => {
    setIsExpanded((prev) => !prev);
  };

  const openConversation = async (friend) => {
    // Sprawdź, czy istnieje już konwersacja między użytkownikami
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingConversation = snapshot.docs.find((doc) =>
        doc.data().participants.includes(friend.id)
      );

      if (existingConversation) {
        setActiveConversationId(existingConversation.id);
      } else {
        // Jeśli nie ma konwersacji, utwórz nową
        addDoc(conversationsRef, {
          participants: [auth.currentUser.uid, friend.id],
          lastMessage: "",
          timestamp: null,
        }).then((docRef) => {
          setActiveConversationId(docRef.id);
        });
      }
    });

    return () => unsubscribe();
  };

  return (
    <div
      className={`fixed bottom-0 right-0 ${
        isExpanded ? "w-full sm:w-96 h-[70vh]" : "w-16 h-16"
      } bg-gray-800 shadow-lg transition-all duration-300 z-50`}
      style={{
        overflow: isExpanded ? "hidden" : "visible",
      }}
    >
      <ChatHeader onToggle={togglePanel} isExpanded={isExpanded} />

      {isExpanded && (
        <div className="flex h-full">
          {/* Lista znajomych */}
          <div className="w-1/3 bg-gray-700 p-2 overflow-y-auto">
            <h3 className="text-white font-bold mb-2">Znajomi</h3>
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => openConversation(friend)}
                  className="flex items-center p-2 bg-gray-600 text-white rounded cursor-pointer hover:bg-gray-500"
                >
                  <img
                    src={friend.profilePicture}
                    alt={`${friend.name} profile`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <p>{friend.name}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Brak znajomych</p>
            )}
          </div>

          {/* Główna sekcja czatu */}
          <div className="w-2/3 flex flex-col bg-gray-800">
            {activeConversationId ? (
              <>
                <MessageList conversationId={activeConversationId} />
                <MessageInput conversationId={activeConversationId} />
              </>
            ) : (
              <div className="flex flex-col justify-center items-center flex-1 text-white">
                <p>Wybierz znajomego, aby rozpocząć rozmowę</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
