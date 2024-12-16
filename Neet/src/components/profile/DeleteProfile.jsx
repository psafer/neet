import { auth, db } from "../../config/firebaseConfig";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import PropTypes from "prop-types";

const DeleteProfile = ({ userId }) => {
  // Funkcja usuwająca konto użytkownika
  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "Jesteś pewny? Konto zostanie usunięte na stałe!"
    );

    if (!confirmation) return;

    try {
      // Usuń dokument profilu użytkownika z Firestore
      const profileRef = doc(db, "profiles", userId);
      await deleteDoc(profileRef);

      // Usuń konto użytkownika z Firebase Authentication
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
      }

      alert("Konto zostało pomyślnie usunięte.");
      window.location.href = "/"; // Przekierowanie na stronę główną
    } catch (error) {
      console.error("Błąd podczas usuwania konta:", error);
      alert("Wystąpił problem podczas usuwania konta. Spróbuj ponownie.");
    }
  };

  return (
    <button
      onClick={handleDeleteAccount}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      Usuń konto
    </button>
  );
};

DeleteProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default DeleteProfile;
