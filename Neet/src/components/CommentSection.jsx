import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";

const CommentSection = ({ post, newComment, handleCommentChange, handleAddComment }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Stan dla Emoji Picker
  const [showAllComments, setShowAllComments] = useState(false); // Kontrola widoczności wszystkich komentarzy
  const emojiPickerRef = useRef(null); // Referencja dla Emoji Picker
  const commentSectionRef = useRef(null); // Referencja do sekcji komentarzy

  // Obsługa kliknięcia poza emoji pickerem i komentarzami
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        commentSectionRef.current &&
        !commentSectionRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false); // Zamknij Emoji Picker
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obsługa dodawania emoji
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    handleCommentChange(post.id, { target: { value: (newComment[post.id] || "") + emoji } });
  };

  // Obsługa dodawania komentarza po naciśnięciu Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddComment(post.id);
    }
  };

  // Obsługa widoczności komentarzy
  const toggleShowComments = () => {
    setShowAllComments(!showAllComments); // Zmieniamy stan na przeciwny
  };

  // Komentarze do wyświetlenia (3 najnowsze lub wszystkie)
  const commentsToDisplay = showAllComments
    ? post.comments.slice().reverse() // Pokazujemy wszystkie, w odwrotnej kolejności
    : post.comments.slice().reverse().slice(0, 3); // Pokazujemy tylko 3 najnowsze

  return (
    <div className="mt-4 border-t border-gray-600 pt-2" ref={commentSectionRef}>
      <div className="mt-2 flex relative">
        <input
          type="text"
          placeholder="Twój komentarz..."
          value={newComment[post.id] || ""}
          onChange={(e) => handleCommentChange(post.id, e)}
          onKeyDown={handleKeyDown} // Obsługa naciśnięcia klawisza Enter
          className="flex-grow p-2 bg-gray-700 text-white rounded"
        />
        <button onClick={() => handleAddComment(post.id)} className="bg-transparent text-orange-500 hover:bg-gray-600 rounded p-2 ml-2">
          <i className="fa-solid fa-paper-plane"></i>
        </button>
        {/* Przycisk dodawania Emoji */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="bg-transparent text-orange-500 hover:bg-gray-600 rounded p-2 ml-2"
        >
          <i className="fa-solid fa-smile"></i>
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            style={{ position: 'absolute', zIndex: 100, bottom: '50px', right: '0' }}
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* Wyświetlanie komentarzy */}
      {post.comments.length > 0 && (
        <div className={`mt-4 ${showAllComments ? 'max-h-52 overflow-y-auto' : ''}`}> {/* Przewijana lista komentarzy */}
          {commentsToDisplay.map((comment) => (
            <div key={comment.id} className="text-gray-300 mb-2">
              <strong>{comment.author}:</strong> {comment.content}
              <span className="text-gray-500 text-sm ml-2">
                {comment.date ? format(comment.date.toDate(), "dd.MM.yyyy, HH:mm") : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Przycisk 'Pokaż więcej / Pokaż mniej' */}
      {post.comments.length > 3 && (
        <button
          onClick={toggleShowComments}
          className="text-orange-500 hover:underline mt-2"
        >
          {showAllComments ? 'Pokaż mniej' : 'Pokaż więcej'}
        </button>
      )}
    </div>
  );
};

// Walidacja PropTypes
CommentSection.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired, // Dodajemy walidację id
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        date: PropTypes.object.isRequired,
      })
    ).isRequired,
  }).isRequired,
  newComment: PropTypes.object.isRequired,
  handleCommentChange: PropTypes.func.isRequired,
  handleAddComment: PropTypes.func.isRequired,
};

export default CommentSection;
