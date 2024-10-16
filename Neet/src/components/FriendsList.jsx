import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // hook do nawigacji
import {
  UserIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline"; // Import z Heroicons v2

const FriendsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState([]); // Lista znajomych pobrana z Firestore
  const listRef = useRef(null); // Referencja do listy znajomych
  const navigate = useNavigate(); // Hook do nawigacji

  // Pobieranie listy zaobserwowanych użytkowników
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const followersRef = collection(db, "followers");

          // Pobieramy dokumenty, gdzie "followerId" to aktualny zalogowany użytkownik
          const q = query(
            followersRef,
            where("followerId", "==", currentUser.uid)
          );
          const followersSnapshot = await getDocs(q);

          // Dla każdego zaobserwowanego użytkownika (followingId) pobieramy szczegóły profilu
          const friendsData = await Promise.all(
            followersSnapshot.docs.map(async (docSnap) => {
              const followingId = docSnap.data().followingId;
              const profileRef = doc(db, "profiles", followingId);
              const profileSnap = await getDoc(profileRef);

              if (profileSnap.exists()) {
                return {
                  id: followingId,
                  name: `${profileSnap.data().firstName} ${
                    profileSnap.data().lastName
                  }`,
                  profilePicture:
                    profileSnap.data().profilePicture || "/mini.png", // Dodajmy zdjęcie profilowe
                };
              } else {
                return null;
              }
            })
          );

          // Filtrujemy null wartości, na wypadek błędów w pobieraniu profili
          setFriends(friendsData.filter((friend) => friend !== null));
        }
      } catch (error) {
        console.error("Błąd podczas pobierania znajomych:", error);
      }
    };

    fetchFriends();
  }, []);

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Zamknij listę, jeśli kliknięto poza nią
  const handleClickOutside = (event) => {
    if (listRef.current && !listRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Funkcja do przejścia do profilu znajomego
  const goToProfile = (friendId) => {
    navigate(`/profile/${friendId}`);
  };

  return (
    <div
      ref={listRef}
      className="absolute right-0 mt-2 w-64 bg-gray-800 shadow-lg rounded-lg p-4 text-white z-50"
    >
      <input
        type="text"
        placeholder="Wyszukaj znajomego..."
        className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filteredFriends.length > 0 ? (
        filteredFriends.map((friend) => (
          <div
            key={friend.id}
            className="border-b border-gray-600 py-2 flex items-center justify-between"
          >
            <div className="flex items-center">
              <img
                src={friend.profilePicture}
                alt={`${friend.name}'s profile`}
                className="w-8 h-8 rounded-full mr-2"
              />
              <p>{friend.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Ikonka ludzika - prowadzi do profilu użytkownika */}
              <button
                onClick={() => goToProfile(friend.id)}
                className="text-gray-400 hover:text-white"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              {/* Ikonka czatu */}
              <button className="text-gray-400 hover:text-white">
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400">Brak wyników</p>
      )}
    </div>
  );
};

export default FriendsList;
