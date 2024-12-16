import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // Hook do nawigacji między stronami
import { UserIcon } from "@heroicons/react/24/outline"; // Ikona użytkownika
import Status from "./Status"; // Import komponentu Status

const FriendsList = () => {
  const [searchTerm, setSearchTerm] = useState(""); // Stan przechowujący wartość wyszukiwania
  const [friends, setFriends] = useState([]); // Lista znajomych pobrana z Firestore
  const [isOpen, setIsOpen] = useState(true); // Stan kontrolujący widoczność listy znajomych
  const listRef = useRef(null); // Referencja do elementu listy znajomych
  const navigate = useNavigate(); // Hook do nawigacji

  // Pobieranie listy zaobserwowanych użytkowników
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const followersRef = collection(db, "followers");

          // Tworzenie zapytania do pobrania zaobserwowanych użytkowników
          const q = query(
            followersRef,
            where("followerId", "==", currentUser.uid)
          );
          const followersSnapshot = await getDocs(q);

          // Pobieranie szczegółów profilu dla każdego zaobserwowanego użytkownika
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
                    profileSnap.data().profilePicture || "/mini.png", // Dodanie zdjęcia profilowego
                };
              } else {
                return null;
              }
            })
          );

          // Usunięcie pustych wpisów (np. gdy nie uda się pobrać profilu)
          setFriends(friendsData.filter((friend) => friend !== null));
        }
      } catch (error) {
        console.error("Błąd podczas pobierania znajomych:", error);
      }
    };

    fetchFriends();
  }, []);

  // Filtracja znajomych na podstawie wpisanej frazy
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obsługa kliknięcia poza listą znajomych, aby ją zamknąć
  const handleClickOutside = (event) => {
    if (listRef.current && !listRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  // Dodanie i usunięcie nasłuchiwania zdarzenia kliknięcia
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Funkcja do nawigacji do profilu znajomego
  const goToProfile = (friendId) => {
    navigate(`/profile/${friendId}`);
  };

  return (
    isOpen && (
      <div
        ref={listRef} // Przypisanie referencji do kontenera listy znajomych
        className="absolute right-0 mt-0 w-64 bg-gray-800 shadow-lg rounded-lg p-4 text-white z-50"
      >
        {/* Pole wyszukiwania znajomych */}
        <input
          type="text"
          placeholder="Wyszukaj znajomego..."
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {filteredFriends.length > 0 ? (
          // Wyświetlanie listy znajomych
          filteredFriends.map((friend) => (
            <div
              key={friend.id} // Klucz identyfikujący element listy
              className="border-b border-gray-600 py-2 flex items-center justify-between"
            >
              <div className="flex items-center">
                {/* Zdjęcie profilowe znajomego */}
                <img
                  src={friend.profilePicture}
                  alt={`${friend.name}'s profile`}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <p>{friend.name}</p>
              </div>
              <div className="flex items-center space-x-2 relative">
                {/* Komponent Status */}
                <Status userId={friend.id} />
                {/* Przycisk nawigujący do profilu znajomego */}
                <button
                  onClick={() => goToProfile(friend.id)}
                  className="text-gray-400 hover:text-white"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          // Wyświetlanie informacji o braku wyników wyszukiwania
          <p className="text-gray-400">Brak wyników</p>
        )}
      </div>
    )
  );
};

export default FriendsList;
