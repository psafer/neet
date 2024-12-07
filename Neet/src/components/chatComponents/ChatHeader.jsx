import PropTypes from "prop-types";

const ChatHeader = ({ onToggle, isExpanded }) => {
  return (
    <div className="bg-gray-900 p-2 flex items-center justify-between text-white">
      <h3 className="text-lg font-bold">Czat</h3>
      <button
        onClick={onToggle}
        className="text-sm bg-orange-500 px-3 py-1 rounded hover:bg-orange-600"
      >
        {isExpanded ? "Zamknij" : "Otwórz"}
      </button>
    </div>
  );
};

ChatHeader.propTypes = {
  onToggle: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
};

export default ChatHeader;
