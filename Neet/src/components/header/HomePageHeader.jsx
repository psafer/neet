import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebaseConfig";
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
import debounce from "lodash/debounce";

const HomePageHeader = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [user, setUser] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const menuRef = useRef(null);
  const friendsListRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

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
      setNotificationCount(snapshot.docs.length); // Aktualizuj licznik powiadomień
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

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
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setIsMobileSearchOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchQuery(searchTerm);
    fetchSearchResults(searchTerm);
  };

  const handleSearchSelect = (userId) => {
    navigate(`/profile/${userId}`);
    setSearchQuery("");
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen((prev) => !prev);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
  };

  const handleProfileClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <>
      <header className="bg-gray-800 p-1 h-16 shadow-md flex justify-between items-center w-full fixed top-0 left-0 z-50">
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

            <div className="flex md:hidden items-center">
              {isMobileSearchOpen ? (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Znajdź użytkownika..."
                  className="bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none w-48"
                />
              ) : (
                <button onClick={toggleMobileSearch}>
                  <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                </button>
              )}
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

        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <img src="/napis.png" alt="Home Page" className="h-10 md:h-10 h-8" />
          <p className="text-sm text-gray-400 mt-1 hidden md:block">
            Social Network
          </p>
        </div>

        {user && (
          <div className="flex items-center relative">
            <div className="relative ml-4">
              <BellIcon
                className={`w-8 h-8 text-gray-400 cursor-pointer ${
                  notificationCount > 0 ? "bell-shake" : ""
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
              onClick={handleProfileClick}
            />
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute top-full right-0 mt-6 bg-gray-800 rounded shadow-lg z-50 transition ease-out duration-200"
              >
                <button
                  onClick={() => navigate(`/profile/${user.uid}`)}
                  className="block px-4 py-2 text-white hover:bg-gray-700"
                >
                  Moje Posty
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="block px-4 py-2 text-white hover:bg-gray-700"
                >
                  Profil
                </button>
                <button
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-white hover:bg-gray-700"
                >
                  Wyloguj
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default HomePageHeader;
