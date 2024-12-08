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

    if (auth.currentUser) {
      const currentUserStatusRef = ref(db, `status/${auth.currentUser.uid}`);

      const onlineState = {
        state: "available",
        last_changed: serverTimestamp(),
      };

      const offlineState = {
        state: "offline",
        last_changed: serverTimestamp(),
      };

      // Set offline state on disconnect
      onDisconnect(currentUserStatusRef).set(offlineState);
      console.log(
        "Ustawiono status offline na disconnect dla:",
        auth.currentUser.uid
      );

      // Set online state when active
      set(currentUserStatusRef, onlineState);
      console.log("Ustawiono status online dla:", auth.currentUser.uid);

      // Ensure status is set to offline when window is closed
      window.addEventListener("beforeunload", () => {
        set(currentUserStatusRef, offlineState);
      });
    }

    // Fetch the status of the given user
    const userStatusRef = ref(db, `status/${userId}`);
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        setStatus(snapshot.val().state || "offline");
      }
    });

    return () => unsubscribe();
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
  userId: PropTypes.string.isRequired, // ID użytkownika, którego status sprawdzamy
};

export default Status;
