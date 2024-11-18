import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const NotificationPanel = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const notificationsRef = collection(
      db,
      "notifications",
      userId,
      "userNotifications"
    );
    const q = query(notificationsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsData);
      const unread = notificationsData.filter((notif) => !notif.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [userId]);

  const deleteNotifications = async () => {
    const batch = writeBatch(db);
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
    await batch.commit();
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="absolute right-0 mt-2 w-64 bg-gray-800 shadow-lg rounded-lg p-4 text-white max-h-72 overflow-y-auto pr-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Powiadomienia</h3>
        <button className="text-orange-500" onClick={deleteNotifications}>
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
              {notif.date ? notif.date.toDate().toLocaleString() : "Brak daty"}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

NotificationPanel.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default NotificationPanel;
