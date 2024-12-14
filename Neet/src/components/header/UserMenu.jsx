import { forwardRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const UserMenu = forwardRef(({ user, onSignOut }, ref) => {
  const navigate = useNavigate();

  return (
    <div
      ref={ref} // Przypisanie ref do głównego elementu div
      className="absolute top-full right-0 mt-6 bg-gray-800 rounded shadow-lg z-50 transition ease-out duration-200"
    >
      {/* Wyświetlanie nazwy użytkownika */}
      <div className="px-4 py-2 text-gray-700 bg-orange-500 font-bold border-b rounded-t border-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
        {user.displayName || `${user.firstName} ${user.lastName}`}
      </div>

      {/* Przyciski menu */}
      <button
        onClick={() => navigate(`/profile/${user.uid}`)}
        className="block px-4 py-2 w-full text-white hover:bg-gray-700"
      >
        Mój profil
      </button>
      <button
        onClick={() => navigate("/profile")}
        className="block px-4 py-2 w-full text-white hover:bg-gray-700"
      >
        Ustawienia
      </button>
      <button
        onClick={onSignOut}
        className="block px-4 py-2 w-full text-white hover:bg-gray-700"
      >
        Wyloguj
      </button>
    </div>
  );
});

UserMenu.displayName = "UserMenu";

UserMenu.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }).isRequired,
  onSignOut: PropTypes.func.isRequired,
};

export default UserMenu;
