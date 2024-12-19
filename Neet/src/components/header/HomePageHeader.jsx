import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../config/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { BellIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import FriendsList from "../shared/FriendsList";
import NotificationPanel from "./NotificationPanel";
import UserMenu from "./UserMenu";
import SearchBar from "../shared/SearchBar";

const HomePageHeader = () => {
  const [profilePicture, setProfilePicture] = useState(null); // Zdjęcie profilowe użytkownika
  const [user, setUser] = useState(null); // Aktualnie zalogowany użytkownik
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); // Status otwarcia panelu powiadomień
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Status otwarcia menu użytkownika
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(false); // Status otwarcia listy znajomych
  const [notificationCount, setNotificationCount] = useState(0); // Liczba powiadomień
  const [hasNewNotifications, setHasNewNotifications] = useState(false); // Status nowych powiadomień

  const menuRef = useRef(null); // Referencja do menu użytkownika
  const friendsListRef = useRef(null); // Referencja do listy znajomych
  const notificationsRef = useRef(null); // Referencja do panelu powiadomień
  const navigate = useNavigate();

  // Pobranie danych profilu użytkownika
  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          // Aktualizacja stanu użytkownika o dane z Firebase Authentication i Firestore
          setUser({
            ...currentUser, // Dane z Firebase Authentication
            firstName: profileSnap.data().firstName, // Dodanie firstName z Firestore
            lastName: profileSnap.data().lastName, // Dodanie lastName z Firestore
          });

          // Ustawienie zdjęcia profilowego
          setProfilePicture(profileSnap.data().profilePicture);
        } else {
          // W przypadku braku danych w Firestore, ustaw dane z Firebase Authentication
          setUser(currentUser);
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

  // Obsługa kliknięcia poza komponenty 
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
      <div className="flex items-center space-x-4 w-full">
        <Link to="/">
          <img
            src="/mini.png"
            alt="Logo"
            className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-full cursor-pointer aspect-square"
          />
        </Link>

        {/* Search Bar */}
        <SearchBar onUserSelect={(userId) => navigate(`/profile/${userId}`)} />
      </div>

      {/* Środkowy nagłówek */}
      <div className="hidden sm:flex absolute left-1/2 transform -translate-x-1/2 flex-col items-center">
        <img src="/napis.png" alt="Home Page" className="h-10 md:h-10 h-8" />
        <p className="text-sm text-gray-400 mt-1 hidden md:block">
          Social Network
        </p>
      </div>

      {/* Elementy użytkownika */}
      {user && (
        <div className="flex items-center relative space-x-4 mr-8">
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
            className="w-8 h-8 min-w-[2rem] min-h-[2rem] text-gray-400 cursor-pointer friends-icon"
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
