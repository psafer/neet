import { useState, useRef, useEffect } from "react";
import { format, isToday } from "date-fns";
import PropTypes from "prop-types";
import EmojiPicker from "emoji-picker-react";
import { Link } from "react-router-dom";

const CommentSection = ({
  post = { comments: [] },
  newComment,
  handleCommentChange,
  handleAddComment,
  updateLocalComments,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
      const newCommentContent = newComment[post.id]?.trim();
      if (newCommentContent) {
        handleAddComment(post.id);
        updateLocalComments({
          id: `temp-${Date.now()}`,
          author: "Ty", // Domyślny autor (dynamicznie ustaw aktualnego użytkownika)
          authorId: "currentUserId", // Ustaw prawidłowe ID aktualnego użytkownika
          authorPicture: "/default-avatar.png", // Możesz tu wstawić prawdziwy avatar
          content: newCommentContent,
          date: new Date(),
        });
      }
    }
  };

  const sortedComments = Array.isArray(post.comments)
    ? [...post.comments].sort(
        (a, b) => new Date(b.date?.toDate()) - new Date(a.date?.toDate())
      )
    : [];

  const formatDate = (date) => {
    if (!date) return "Brak daty";
    const jsDate = date.toDate ? date.toDate() : date;
    return isToday(jsDate) ? format(jsDate, "HH:mm") : format(jsDate, "dd.MM");
  };

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
          onClick={() => {
            const newCommentContent = newComment[post.id]?.trim();
            if (newCommentContent) {
              handleAddComment(post.id);
              updateLocalComments({
                id: `temp-${Date.now()}`,
                author: "Ty",
                authorId: "currentUserId",
                authorPicture: "/assets/mini.png",
                content: newCommentContent,
                date: new Date(),
              });
            }
          }}
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

      {sortedComments.length > 0 && (
        <div className="mt-4 max-h-52 overflow-y-auto space-y-4">
          {sortedComments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-center bg-gray-800 p-3 rounded shadow-md"
            >
              <img
                src={comment.authorPicture || "/default-avatar.png"}
                alt="Profile"
                className="w-8 h-8 rounded-full mr-3"
              />
              <div className="flex-grow">
                <Link
                  to={`/profile/${comment.authorId || "unknown"}`}
                  className="text-sm text-white font-semibold hover:underline"
                >
                  {comment.author}
                </Link>
                <p className="text-gray-300 text-sm">{comment.content}</p>
              </div>
              <span className="text-gray-500 text-xs ml-2">
                {comment.date ? formatDate(comment.date) : "Brak daty"}
              </span>
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
        authorId: PropTypes.string,
        authorPicture: PropTypes.string,
        content: PropTypes.string.isRequired,
        date: PropTypes.object,
      })
    ),
  }).isRequired,
  newComment: PropTypes.object.isRequired,
  handleCommentChange: PropTypes.func.isRequired,
  handleAddComment: PropTypes.func.isRequired,
  updateLocalComments: PropTypes.func.isRequired,
};

export default CommentSection;
