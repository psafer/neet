import { useState, useRef, useEffect } from "react";
import { format, isToday } from "date-fns";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";
import { Link } from "react-router-dom";

const CommentSection = ({
  post = { comments: [] }, // Domyślna wartość, aby uniknąć błędów, jeśli brak komentarzy
  newComment,
  handleCommentChange,
  handleAddComment,
  handleDeleteComment,
  currentUserId,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Stan widoczności emoji pickera
  const emojiPickerRef = useRef(null); // Referencja do emoji pickera
  const commentSectionRef = useRef(null); // Referencja do sekcji komentarzy

  // Obsługa kliknięcia poza emoji pickerem lub sekcją komentarzy
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        commentSectionRef.current &&
        !commentSectionRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false); // Ukryj emoji picker
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obsługa wyboru emoji
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    handleCommentChange(post.id, {
      target: { value: (newComment[post.id] || "") + emoji }, // Dodaj emoji do bieżącej treści komentarza
    });
  };

  // Obsługa dodania komentarza
  const handleAddCommentClick = () => {
    const newCommentContent = newComment[post.id]?.trim(); // Usuń białe znaki z końca i początku
    if (newCommentContent) {
      handleAddComment(post.id); // Wywołaj funkcję dodawania komentarza
      handleCommentChange(post.id, { target: { value: "" } }); // Wyczyść pole komentarza
    }
  };

  // Obsługa klawisza Enter w polu tekstowym
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddCommentClick(); // Dodaj komentarz po wciśnięciu Enter
    }
  };

  // Sortowanie komentarzy malejąco według daty
  const sortedComments = Array.isArray(post.comments)
    ? [...post.comments].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return dateB - dateA; // Malejące sortowanie
      })
    : [];

  // Formatowanie daty komentarzy
  const formatDate = (date) => {
    if (!date) return "Brak daty";
    const jsDate = typeof date.toDate === "function" ? date.toDate() : date;
    return isToday(jsDate) ? format(jsDate, "HH:mm") : format(jsDate, "dd.MM");
  };

  return (
    <div className="mt-4 border-t border-gray-600 pt-2" ref={commentSectionRef}>
      {/* Input do dodawania komentarzy */}
      <div className="mt-2 flex relative items-center w-full">
        <input
          type="text"
          placeholder="Twój komentarz..."
          value={newComment[post.id] || ""} // Wyświetlanie aktualnej treści komentarza
          onChange={(e) => handleCommentChange(post.id, e)} // Obsługa zmian w polu tekstowym
          onKeyDown={handleKeyDown} // Obsługa Enter
          className="flex-grow p-2 pr-0 bg-gray-700 text-white rounded"
        />
        <button
          onClick={handleAddCommentClick}
          className="absolute right-10 text-orange-500 hover:bg-gray-600 rounded p-2 flex-shrink-0"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="absolute right-2 text-orange-500 hover:bg-gray-600 rounded p-2 flex-shrink-0"
        >
          <i className="fa-solid fa-smile"></i>
        </button>
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            style={{
              position: "absolute",
              zIndex: 100,
              bottom: "50px",
              right: "0",
            }}
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>

      {/* Wyświetlanie komentarzy */}
      {sortedComments.length > 0 && (
        <div className="mt-4 max-h-52 overflow-y-auto space-y-4">
          {sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-center bg-gray-800 p-2 rounded shadow-md relative"
            >
              {/* Obrazek autora komentarza */}
              <img
                src={comment.authorPicture || "/mini.png"}
                alt={`${comment.author}'s profile`}
                onError={(e) => (e.target.src = "/mini.png")} // Ustaw domyślny obraz w razie błędu
                className="w-8 h-8 rounded-full mr-3"
              />
              {/* Treść komentarza */}
              <div className="flex-grow">
                <Link
                  to={`/profile/${comment.authorId || "unknown"}`} // Link do profilu autora
                  className="text-sm text-white font-semibold hover:underline"
                >
                  {comment.author}
                </Link>
                <p className="text-gray-300 text-sm">{comment.content}</p>
              </div>
              <span className="text-gray-500 text-xs ml-2 mt-7">
                {comment.date ? formatDate(comment.date) : "Brak daty"}
              </span>

              {/* Opcja usuwania komentarza (tylko dla autora) */}
              {comment.authorId === currentUserId && (
                <button
                  onClick={() => handleDeleteComment(post.id, comment.id)} // Funkcja usuwania komentarza
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-sm"
                  title="Usuń komentarz"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CommentSection.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        authorId: PropTypes.string.isRequired,
        authorPicture: PropTypes.string,
        content: PropTypes.string.isRequired,
        date: PropTypes.object,
      })
    ),
  }).isRequired,
  newComment: PropTypes.object.isRequired,
  handleCommentChange: PropTypes.func.isRequired,
  handleAddComment: PropTypes.func.isRequired,
  handleDeleteComment: PropTypes.func.isRequired, // Dodano
  currentUserId: PropTypes.string.isRequired, // Dodano
};

export default CommentSection;
