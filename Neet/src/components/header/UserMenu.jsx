import { forwardRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const UserMenu = forwardRef(({ user, onSignOut }, ref) => {
  const navigate = useNavigate(); // Hook do nawigacji między stronami

  return (
    <div
      ref={ref} // Przypisanie `ref` do głównego elementu `div`
      className="absolute top-full right-0 mt-6 bg-gray-800 rounded shadow-lg z-50 transition ease-out duration-200"
    >
      {/* Wyświetlanie nazwy użytkownika (lub imienia i nazwiska, jeśli brak nazwy) */}
      <div className="px-4 py-2 text-gray-700 bg-orange-500 font-bold border-b rounded-t border-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
        {user.displayName || `${user.firstName} ${user.lastName}`}
      </div>

      {/* Opcja przejścia do profilu użytkownika */}
      <button
        onClick={() => navigate(`/profile/${user.uid}`)}
        className="block px-4 py-2 w-full text-white hover:bg-gray-700"
      >
        Mój profil
      </button>

      {/* Opcja przejścia do ustawień */}
      <button
        onClick={() => navigate("/profile")}
        className="block px-4 py-2 w-full text-white hover:bg-gray-700"
      >
        Ustawienia
      </button>

      {/* Opcja wylogowania użytkownika */}
      <button
        onClick={onSignOut}
        className="block px-4 py-2 w-full text-white hover:bg-gray-700"
      >
        Wyloguj
      </button>
    </div>
  );
});

// Ustawienie nazwy wyświetlanej dla komponentu forwardRef
UserMenu.displayName = "UserMenu";

// PropTypes dla weryfikacji danych przekazanych do komponentu
UserMenu.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired, // ID użytkownika
    displayName: PropTypes.string, // Wyświetlana nazwa użytkownika
    firstName: PropTypes.string, // Imię użytkownika
    lastName: PropTypes.string, // Nazwisko użytkownika
  }).isRequired,
  onSignOut: PropTypes.func.isRequired, // Funkcja obsługująca wylogowanie użytkownika
};

export default UserMenu;
