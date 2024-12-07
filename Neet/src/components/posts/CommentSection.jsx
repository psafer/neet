import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";

const CommentSection = ({
  post = { comments: [] },
  newComment,
  handleCommentChange,
  handleAddComment,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const emojiPickerRef = useRef(null);
  const commentSectionRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        commentSectionRef.current &&
        !commentSectionRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    handleCommentChange(post.id, {
      target: { value: (newComment[post.id] || "") + emoji },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddComment(post.id);
    }
  };

  const toggleShowComments = () => {
    setShowAllComments(!showAllComments);
  };

  const commentsToDisplay = Array.isArray(post.comments)
    ? showAllComments
      ? post.comments.slice().reverse()
      : post.comments.slice().reverse().slice(0, 3)
    : [];

  return (
    <div className="mt-4 border-t border-gray-600 pt-2" ref={commentSectionRef}>
      <div className="mt-2 flex relative">
        <input
          type="text"
          placeholder="Twój komentarz..."
          value={newComment[post.id] || ""}
          onChange={(e) => handleCommentChange(post.id, e)}
          onKeyDown={handleKeyDown}
          className="flex-grow p-2 bg-gray-700 text-white rounded"
        />
        <button
          onClick={() => handleAddComment(post.id)}
          className="bg-transparent text-orange-500 hover:bg-gray-600 rounded p-2 ml-2"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="bg-transparent text-orange-500 hover:bg-gray-600 rounded p-2 ml-2"
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

      {commentsToDisplay.length > 0 && (
        <div
          className={`mt-4 ${
            showAllComments ? "max-h-52 overflow-y-auto" : ""
          }`}
        >
          {commentsToDisplay.map((comment) => (
            <div key={comment.id} className="text-gray-300 mb-2">
              <strong>{comment.author}:</strong> {comment.content}
              <span className="text-gray-500 text-sm ml-2">
                {comment.date && comment.date.toDate
                  ? format(comment.date.toDate(), "dd.MM.yyyy, HH:mm")
                  : "Brak daty"}
              </span>
            </div>
          ))}
        </div>
      )}

      {post.comments && post.comments.length > 3 && (
        <button
          onClick={toggleShowComments}
          className="text-orange-500 hover:underline mt-2"
        >
          {showAllComments ? "Pokaż mniej" : "Pokaż więcej"}
        </button>
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
        content: PropTypes.string.isRequired,
        date: PropTypes.object, // Teraz `date` jest opcjonalne
      })
    ),
  }).isRequired,
  newComment: PropTypes.object.isRequired,
  handleCommentChange: PropTypes.func.isRequired,
  handleAddComment: PropTypes.func.isRequired,
};

export default CommentSection;
