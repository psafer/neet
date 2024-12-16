import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const NotificationPanel = ({ userId }) => {
  const [notifications, setNotifications] = useState([]); // Stan przechowujący listę powiadomień
  const navigate = useNavigate(); // Hook nawigacji

  useEffect(() => {
    if (!userId) return; // Sprawdzenie, czy `userId` jest dostępne

    // Pobranie powiadomień z Firestore w czasie rzeczywistym
    const notificationsRef = collection(
      db,
      "notifications",
      userId,
      "userNotifications"
    );
    const q = query(notificationsRef, orderBy("date", "desc")); // Sortowanie według daty malejąco

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsData); // Aktualizacja stanu z powiadomieniami
    });

    return () => unsubscribe(); // Usunięcie subskrypcji przy odmontowaniu komponentu
  }, [userId]);

  // Usuwanie wszystkich powiadomień
  const deleteNotifications = async () => {
    try {
      const batch = writeBatch(db); // Tworzenie batcha do usunięcia wielu dokumentów jednocześnie
      notifications.forEach((notif) => {
        const notifRef = doc(
          db,
          "notifications",
          userId,
          "userNotifications",
          notif.id
        );
        batch.delete(notifRef);
      });
      await batch.commit(); // Wysłanie batcha do Firestore
      setNotifications([]); // Resetowanie stanu po usunięciu
    } catch (error) {
      console.error("Błąd podczas usuwania powiadomień:", error);
    }
  };

  // Obsługa kliknięcia powiadomienia
  const handleNotificationClick = (notif) => {
    if (notif.type === "post" && notif.postId) {
      // Przekierowanie do posta
      navigate("/", { state: { highlightedPostId: notif.postId } });
    } else if (notif.type === "follow" && notif.followerId) {
      // Przekierowanie do profilu obserwującego
      navigate(`/profile/${notif.followerId}`);
    } else if (
      (notif.type === "like" || notif.type === "comment") &&
      notif.postId
    ) {
      // Przekierowanie do posta dla polubień lub komentarzy
      navigate("/", { state: { highlightedPostId: notif.postId } });
    } else {
      alert("Nie można obsłużyć tego powiadomienia."); // Obsługa nieznanych typów powiadomień
    }
  };

  return (
    <div className="absolute right-0 mt-7 w-64 bg-gray-800 shadow-lg rounded-lg p-4 text-white max-h-72 overflow-y-auto pr-2 z-50">
      {/* Nagłówek panelu powiadomień */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Powiadomienia</h3>
        <button
          className="text-orange-500 hover:text-orange-300"
          onClick={deleteNotifications}
        >
          <i className="fa-solid fa-broom"></i>
        </button>
      </div>

      {/* Lista powiadomień lub informacja o ich braku */}
      {notifications.length === 0 ? (
        <p className="text-gray-400">Brak powiadomień</p>
      ) : (
        notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            className="border-b border-gray-600 py-2 px-3 cursor-pointer hover:bg-gray-700 hover:text-orange-300 transition-all rounded"
          >
            {/* Treść powiadomienia */}
            <p className="text-sm">{notif.message}</p>
            {/* Data powiadomienia */}
            <span className="text-xs text-gray-400">
              {notif.date ? notif.date.toDate().toLocaleString() : "Brak daty"}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

NotificationPanel.propTypes = {
  userId: PropTypes.string.isRequired, // ID użytkownika, dla którego pobierane są powiadomienia
};

export default NotificationPanel;
