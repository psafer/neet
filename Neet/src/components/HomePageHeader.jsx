import { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { BellIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

const HomePageHeader = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
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

        const notificationsRef = collection(
          db,
          "notifications",
          currentUser.uid,
          "userNotifications"
        );
        const q = query(notificationsRef, orderBy("date", "desc"));
        const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          const notificationsData = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          setNotifications(notificationsData);
          const unread = notificationsData.filter(
            (notif) => !notif.read
          ).length;
          setUnreadCount(unread);
        });

        return () => unsubscribeNotifications();
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  const handleProfileClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const deleteNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        const notifRef = doc(
          db,
          "notifications",
          user.uid,
          "userNotifications",
          notif.id
        );
        batch.delete(notifRef);
      });
      await batch.commit();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Błąd podczas usuwania powiadomień:", error);
    }
  };

  return (
    <header className="bg-gray-800 p-1 h-16 shadow-md flex justify-between items-center w-full fixed top-0 left-0 z-50">
      <div className="flex items-center">
        <Link to="/">
          {" "}
          {/* Link to the homepage */}
          <img
            src="/mini.png"
            alt="Logo"
            className="w-auto h-14 rounded-full cursor-pointer"
          />
        </Link>
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <img src="/napis.png" alt="Home Page" className="h-10" />
        <p className="text-sm text-gray-400 mt-1">Social Network</p>
      </div>
      {user && (
        <div className="flex items-center">
          <div className="relative mr-4">
            <BellIcon
              className={`w-8 h-8 text-gray-400 cursor-pointer ${
                unreadCount > 0 ? "bell-shake" : ""
              }`}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                {unreadCount}
              </span>
            )}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 shadow-lg rounded-lg p-4 text-white max-h-72 overflow-y-auto pr-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">Powiadomienia</h3>
                  <button
                    className="text-orange-500"
                    onClick={deleteNotifications}
                  >
                    <i className="fa-solid fa-broom"></i>
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-gray-400">Brak powiadomień</p>
                ) : (
                  notifications.map((notif, index) => (
                    <div key={index} className="border-b border-gray-600 py-2">
                      <p>{notif.message}</p>
                      <span className="text-gray-500 text-sm">
                        {notif.date
                          ? format(notif.date.toDate(), "dd.MM.yyyy, HH:mm")
                          : "Brak daty"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <img
            src={profilePicture || "/mini.png"}
            alt="Profile"
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={handleProfileClick}
          />
          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-lg z-50 transition ease-out duration-200"
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
  );
};

export default HomePageHeader;
