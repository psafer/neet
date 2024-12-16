import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../config/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import {
  BellIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import FriendsList from "../shared/FriendsList";
import NotificationPanel from "./NotificationPanel";
import UserMenu from "./UserMenu";
import debounce from "lodash/debounce";

const HomePageHeader = () => {
  const [profilePicture, setProfilePicture] = useState(null); // Zdjęcie profilowe użytkownika
  const [user, setUser] = useState(null); // Aktualnie zalogowany użytkownik
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // Status otwarcia panelu powiadomień
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Status otwarcia menu użytkownika
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(false); // Status otwarcia listy znajomych
  const [searchQuery, setSearchQuery] = useState(""); // Wyszukiwane zapytanie
  const [searchResults, setSearchResults] = useState([]); // Wyniki wyszukiwania
  const [notificationCount, setNotificationCount] = useState(0); // Liczba powiadomień
  const [hasNewNotifications, setHasNewNotifications] = useState(false); // Status nowych powiadomień

  const menuRef = useRef(null); // Referencja do menu użytkownika
  const friendsListRef = useRef(null); // Referencja do listy znajomych
  const notificationsRef = useRef(null); // Referencja do panelu powiadomień
  const searchRef = useRef(null); // Referencja do wyszukiwarki
  const navigate = useNavigate();

  // Pobranie danych profilu użytkownika
  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfilePicture(docSnap.data().profilePicture);
        }
      }
    };

    fetchProfile();
  }, []);

  // Subskrypcja powiadomień w czasie rzeczywistym
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(
      db,
      "notifications",
      user.uid,
      "userNotifications"
    );
    const q = query(notificationsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => doc.data());
      setNotificationCount(snapshot.docs.length);
      setHasNewNotifications(notifications.some((notif) => !notif.read)); // Sprawdzenie, czy są nieprzeczytane powiadomienia
    });

    return () => unsubscribe();
  }, [user]);

  // Obsługa wylogowania użytkownika
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  // Obsługa kliknięcia poza komponenty (zamykanie paneli)
  const handleClickOutside = (event) => {
    if (
      notificationsRef.current &&
      !notificationsRef.current.contains(event.target)
    ) {
      setIsNotificationsOpen(false);
    }
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
    if (
      friendsListRef.current &&
      !friendsListRef.current.contains(event.target)
    ) {
      setIsFriendsListOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Pobranie wyników wyszukiwania z Firebase
  const fetchSearchResults = debounce(async (searchTerm) => {
    if (searchTerm.length > 1) {
      const usersRef = collection(db, "profiles");
      const q = query(usersRef, orderBy("firstName"));
      try {
        const querySnapshot = await getDocs(q);

        const filteredResults = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => {
            const fullName = `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`;
            return fullName.includes(searchTerm.toLowerCase());
          });

        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Błąd podczas pobierania wyników wyszukiwania:", error);
      }
    } else {
      setSearchResults([]);
    }
  }, 500);

  // Obsługa zmiany w wyszukiwarce
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchQuery(searchTerm);
    fetchSearchResults(searchTerm);
  };

  // Przekierowanie do wybranego profilu z wyników wyszukiwania
  const handleSearchSelect = (userId) => {
    navigate(`/profile/${userId}`);
    setSearchQuery("");
  };

  // Przełączanie stanu panelu powiadomień
  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    if (hasNewNotifications) {
      setHasNewNotifications(false); // Resetowanie flagi nowych powiadomień
    }
  };

  return (
    <header className="bg-gray-800 p-1 h-16 shadow-md flex justify-between items-center w-full fixed top-0 left-0 z-50">
      {/* Logo i wyszukiwarka */}
      <div className="flex items-center space-x-4">
        <Link to="/">
          <img
            src="/mini.png"
            alt="Logo"
            className="w-auto h-14 rounded-full cursor-pointer"
          />
        </Link>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <div className="hidden md:flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Znajdź użytkownika..."
              className="bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none w-full"
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-2 top-2 text-gray-400" />
          </div>
          {searchQuery && (
            <ul
              ref={searchRef}
              className="absolute bg-gray-800 text-white w-full max-h-60 overflow-y-auto rounded-lg shadow-lg z-50 mt-2"
            >
              {searchResults.length === 0 ? (
                <li className="p-2 text-gray-400">
                  Nie znaleziono użytkownika
                </li>
              ) : (
                searchResults.map((result) => (
                  <li
                    key={result.id}
                    onClick={() => handleSearchSelect(result.id)}
                    className="cursor-pointer hover:bg-gray-700 p-2 flex items-center"
                  >
                    <img
                      src={result.profilePicture || "/mini.png"}
                      alt={`${result.firstName} ${result.lastName}`}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    {result.firstName} {result.lastName}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Środkowy nagłówek */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <img src="/napis.png" alt="Home Page" className="h-10 md:h-10 h-8" />
        <p className="text-sm text-gray-400 mt-1 hidden md:block">
          Social Network
        </p>
      </div>

      {/* Elementy użytkownika */}
      {user && (
        <div className="flex items-center relative">
          <div className="relative ml-4">
            <BellIcon
              className={`w-8 h-8 text-gray-400 cursor-pointer ${
                hasNewNotifications ? "bell-shake" : ""
              }`}
              onClick={toggleNotifications}
            />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                {notificationCount}
              </span>
            )}
            {isNotificationsOpen && (
              <div ref={notificationsRef}>
                <NotificationPanel userId={user.uid} />
              </div>
            )}
          </div>

          <UserGroupIcon
            className="w-8 h-8 text-gray-400 cursor-pointer mr-4 friends-icon"
            onClick={() => setIsFriendsListOpen((prev) => !prev)}
          />
          {isFriendsListOpen && (
            <div ref={friendsListRef} className="absolute top-16 right-4">
              <FriendsList />
            </div>
          )}

          <img
            src={profilePicture || "/mini.png"}
            alt="Profile"
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => setIsMenuOpen((prev) => !prev)}
          />
          {isMenuOpen && (
            <UserMenu ref={menuRef} user={user} onSignOut={handleSignOut} />
          )}
        </div>
      )}
    </header>
  );
};

export default HomePageHeader;
