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
import { auth } from "../../config/firebaseConfig";

const Status = ({ userId }) => {
  const [status, setStatus] = useState("offline");

  useEffect(() => {
    const db = getDatabase();
    let currentUserStatusRef = null;

    const updateStatus = async (user) => {
      if (user) {
        // Referencja do statusu użytkownika
        currentUserStatusRef = ref(db, `status/${user.uid}`);

        const onlineState = {
          state: "available",
          last_changed: serverTimestamp(),
        };

        const offlineState = {
          state: "offline",
          last_changed: serverTimestamp(),
        };

        try {
          // Ustaw status "offline" na disconnect
          await onDisconnect(currentUserStatusRef).set(offlineState);

          // Ustaw status "available" przy logowaniu
          await set(currentUserStatusRef, onlineState);
        } catch (error) {
          console.error("Błąd podczas ustawiania statusu:", error);
        }
      } else {
        // Użytkownik wylogowany - ustaw "offline" natychmiast
        if (currentUserStatusRef) {
          try {
            await set(currentUserStatusRef, {
              state: "offline",
              last_changed: serverTimestamp(),
            });
          } catch (error) {
            console.error("Błąd podczas ustawiania statusu offline:", error);
          }
        }
      }
    };

    // Nasłuchuj zmian użytkownika
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      updateStatus(user);
    });

    // Nasłuchuj statusu dla innego użytkownika (userId)
    const userStatusRef = ref(db, `status/${userId}`);
    const unsubscribeStatus = onValue(userStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.val().state || "offline");
      }
    });

    return () => {
      // Posprzątaj przy odmontowaniu komponentu
      if (currentUserStatusRef) {
        set(currentUserStatusRef, {
          state: "offline",
          last_changed: serverTimestamp(),
        });
      }
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
