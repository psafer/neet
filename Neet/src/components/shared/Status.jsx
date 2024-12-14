import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { auth } from "../../firebaseConfig";

const Status = ({ userId }) => {
  const [status, setStatus] = useState("offline");

  useEffect(() => {
    const db = getDatabase();

    let currentUserStatusRef = null;

    // Obsługa zmiany statusu użytkownika
    const handleStatusChange = (user) => {
      if (user) {
        // Jeśli użytkownik jest zalogowany, ustaw status
        currentUserStatusRef = ref(db, `status/${user.uid}`);

        const onlineState = {
          state: "available",
          last_changed: serverTimestamp(),
        };

        const offlineState = {
          state: "offline",
          last_changed: serverTimestamp(),
        };

        // Ustaw status "offline" na disconnect
        onDisconnect(currentUserStatusRef).set(offlineState);

        // Ustaw status "online"
        set(currentUserStatusRef, onlineState);
      } else if (currentUserStatusRef) {
        // Jeśli użytkownik się wylogowuje, ustaw "offline"
        set(currentUserStatusRef, {
          state: "offline",
          last_changed: serverTimestamp(),
        });
      }
    };

    // Nasłuchuj zmiany użytkownika
    const unsubscribeAuth = auth.onAuthStateChanged(handleStatusChange);

    // Nasłuchuj statusu użytkownika
    const userStatusRef = ref(db, `status/${userId}`);
    const unsubscribeStatus = onValue(userStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.val().state || "offline");
      }
    });

    // Posprzątaj
    return () => {
      unsubscribeAuth();
      unsubscribeStatus();
    };
  }, [userId]);

  const getStatusColor = () => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "away":
        return "bg-orange-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getStatusColor()}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    ></div>
  );
};

Status.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default Status;
