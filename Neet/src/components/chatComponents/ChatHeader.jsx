import PropTypes from "prop-types";
import { useState } from "react";

const ChatHeader = ({ onToggle, isExpanded }) => {
  const [showPopup, setShowPopup] = useState(false);

  const togglePopup = () => {
    setShowPopup((prev) => !prev);
  };

  return (
    <div className="bg-gray-900 p-2 flex items-center justify-between text-white relative">
      <h3 className="text-lg font-bold">Czat</h3>
      <div className="flex items-center space-x-2">
        {/* Ikona z kółkiem */}
        <div className="relative">
          <button
            onClick={togglePopup}
            className="w-8 h-8 flex items-center justify-center bg-gray-700 text-white rounded-full hover:bg-gray-600"
          >
            <i className="fa-solid fa-info"></i>
          </button>
          {/* Popup */}
          {showPopup && (
            <div className="absolute top-12 right-0 w-64 bg-gray-800 text-white p-4 rounded shadow-lg z-10">
              <p className="text-sm">
                Aby prowadzić konwersację, musisz zaobserwować znajomego.
              </p>
            </div>
          )}
        </div>
        {/* Przycisk rozwijania/zamykania */}
        <button
          onClick={onToggle}
          className="text-sm bg-orange-500 px-3 py-1 rounded hover:bg-orange-600"
        >
          <i
            className={`fa-solid ${
              isExpanded ? "fa-chevron-down" : "fa-chevron-up"
            }`}
          ></i>
        </button>
      </div>
    </div>
  );
};

ChatHeader.propTypes = {
  onToggle: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
};

export default ChatHeader;
