import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const UserMenu = ({ user, onSignOut }) => {
  const navigate = useNavigate();

  return (
    <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-lg z-50 transition ease-out duration-200">
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
        onClick={onSignOut}
        className="block px-4 py-2 text-white hover:bg-gray-700"
      >
        Wyloguj
      </button>
    </div>
  );
};

UserMenu.propTypes = {
  user: PropTypes.object.isRequired,
  onSignOut: PropTypes.func.isRequired,
};

export default UserMenu;
