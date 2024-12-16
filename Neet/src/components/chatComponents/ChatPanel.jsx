import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import Status from "../shared/Status"; // Importujemy komponent Status

const ChatPanel = () => {
  const [friends, setFriends] = useState([]); // Lista znajomych
  const [filteredFriends, setFilteredFriends] = useState([]); // Filtrowana lista znajomych
  const [searchTerm, setSearchTerm] = useState(""); // Wyszukiwany tekst
  const [activeConversationId, setActiveConversationId] = useState(null); // Aktywna konwersacja
  const [activeFriendId, setActiveFriendId] = useState(null); // Id aktywnego znajomego
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

        const filtered = friendsData.filter((friend) => friend !== null);
        setFriends(filtered);
        setFilteredFriends(filtered);
      });

      return () => unsubscribe();
    };

    fetchFriends();
  }, []);

  // Przełączanie stanu rozwinięcia panelu czatu
  const togglePanel = () => {
    setIsExpanded((prev) => !prev);
  };

  // Otwieranie lub tworzenie nowej konwersacji
  const openConversation = async (friend) => {
    setActiveFriendId(friend.id); // Ustawienie aktywnego znajomego
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
        // Jeśli konwersacja istnieje, ustaw jej ID jako aktywne
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

  // Obsługa zmiany wyszukiwanego tekstu
  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredFriends(
      friends.filter((friend) => friend.name.toLowerCase().includes(term))
    );
  };

  return (
    <div
      className={`fixed bottom-0 right-0 ${
        isExpanded ? "w-full sm:w-[540px] h-[70vh]" : "w-36 h-10"
      } bg-gray-800 shadow-lg transition-all duration-300 z-50`}
    >
      {/* Nagłówek - zawsze widoczny */}
      <div className="h-12 bg-gray-900">
        <ChatHeader onToggle={togglePanel} isExpanded={isExpanded} />
      </div>

      {isExpanded && (
        <div className="flex h-[calc(100%-3rem)]">
          {/* Lista znajomych */}
          <div className="w-1/3 bg-gray-700 p-2 overflow-y-auto border-r-2 border-slate-800 relative">
            <h3 className="text-white font-bold mb-2">Znajomi</h3>
            {/* Wyszukiwarka znajomych */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Szukaj..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full p-2 pl-10 rounded bg-gray-600 text-white"
              />
              {/* Ikona lupki */}
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="fas fa-search"></i>
              </span>
            </div>
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => openConversation(friend)}
                  className={`flex items-center p-2 text-white cursor-pointer relative ${
                    activeFriendId === friend.id
                      ? "bg-gray-800"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                >
                  {/* Zdjęcie profilowe */}
                  <img
                    src={friend.profilePicture}
                    alt={`${friend.name} profile`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <p className="text-white text-sm">{friend.name}</p>
                  {/* Kropka statusu */}
                  <div className="absolute top-2 right-2">
                    <Status userId={friend.id} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Brak wyników</p>
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
              <div className="flex flex-col ml-10 justify-center items-center flex-1 text-white">
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
