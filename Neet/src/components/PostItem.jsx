import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import CommentSection from "./CommentSection";
import PropTypes from "prop-types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

const PostItem = ({
  post,
  user,
  handleLike,
  handleCommentChange,
  newComment,
  handleAddComment,
  handleDeletePost,
  authorName, // Dodajemy `authorName` jako prop
  authorProfilePicture, // Dodajemy `authorProfilePicture` jako prop
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      if (user) {
        const followersRef = collection(db, "followers");
        const q = query(
          followersRef,
          where("followerId", "==", user.uid),
          where("followingId", "==", post.userId)
        );
        const querySnapshot = await getDocs(q);
        setIsFollowing(!querySnapshot.empty);
      }
    };

    checkFollowingStatus();
  }, [user, post.userId]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? post.imageUrl.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === post.imageUrl.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleDelete = () => {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć post?");
    if (confirmed) {
      handleDeletePost(post.id);
    }
  };

  const toggleCommentForm = () => {
    setShowCommentForm((prevState) => !prevState);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mx-auto max-w-3xl border border-gray-600 relative">
      <div className="flex items-center mb-4 relative">
        {authorProfilePicture ? (
          <img
            src={authorProfilePicture} // Użycie zaktualizowanego zdjęcia profilowego
            alt="Author"
            className="w-9 h-9 rounded-full mr-2 mb-2"
          />
        ) : (
          <p className="text-gray-400">Brak zdjęcia profilowego</p>
        )}

        <div className="relative flex items-center">
          <p
            className="text-lg font-semibold text-white cursor-pointer"
            onClick={toggleDropdown}
          >
            {authorName || "Anonim"} {/* Użycie przekazanego `authorName` */}
          </p>

          {isFollowing && (
            <i className="fa-solid fa-check-circle ml-2 text-green-500"></i>
          )}

          {isDropdownOpen && (
            <div className="absolute bg-gray-700 text-white rounded shadow-lg top-full mt-2 w-40 z-10">
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="block w-full text-left px-4 py-2 hover:bg-gray-600"
              >
                <Link to={`/profile/${post.userId}`}>Profil</Link>
              </button>
            </div>
          )}
        </div>

        {user && user.uid === post.userId && (
          <div className="ml-auto relative">
            <button
              onClick={handleDelete}
              className="text-red-500 p-2 hover:text-red-700"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border border-gray-600 rounded-lg">
        <p className="text-gray-300">{post.content}</p>

        {post.imageUrl && post.imageUrl.length > 0 && (
          <div className="relative mt-4">
            <img
              src={post.imageUrl[currentImageIndex]}
              alt={`Post Image ${currentImageIndex + 1}`}
              className="w-auto h-64 object-contain rounded-lg mx-auto transition duration-500 ease-in-out transform"
            />
            {post.imageUrl.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
                >
                  &#8592;
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
                >
                  &#8594;
                </button>
              </>
            )}
          </div>
        )}

        {post.videoUrl && post.videoUrl.length > 0 && (
          <div className="relative mt-4">
            {post.videoUrl.map((video, index) => (
              <video
                key={index}
                src={video}
                controls
                className="w-full h-64 object-contain rounded-lg mx-auto"
              />
            ))}
          </div>
        )}

        {post.audioUrl && post.audioUrl.length > 0 && (
          <div className="relative mt-4">
            {post.audioUrl.map((audio, index) => (
              <audio
                key={index}
                src={audio}
                controls
                className="w-full rounded-lg mx-auto"
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center text-sm ${
                post.likes.includes(user?.uid)
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              <i
                className={`fa-solid fa-heart mr-1 ${
                  post.likes.includes(user?.uid)
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              ></i>
              {post.likes.length}
            </button>
            <button
              onClick={toggleCommentForm}
              className="flex items-center text-sm text-gray-500 ml-4"
            >
              <i className="fa-solid fa-comment mr-1"></i>
              {post.comments?.length || 0}
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Opublikowano:{" "}
            {post.date
              ? format(post.date.toDate(), "dd.MM.yyyy, HH:mm")
              : "Brak daty"}
          </div>
        </div>

        {showCommentForm && (
          <CommentSection
            post={post}
            user={user}
            newComment={newComment}
            handleCommentChange={handleCommentChange}
            handleAddComment={handleAddComment}
          />
        )}
      </div>
    </div>
  );
};

PostItem.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    profilePicture: PropTypes.string,
    userId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    imageUrl: PropTypes.arrayOf(PropTypes.string),
    videoUrl: PropTypes.arrayOf(PropTypes.string),
    audioUrl: PropTypes.arrayOf(PropTypes.string),
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        content: PropTypes.string,
        date: PropTypes.object,
      })
    ),
    likes: PropTypes.arrayOf(PropTypes.string).isRequired,
    date: PropTypes.object,
  }).isRequired,
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }),
  authorName: PropTypes.string,
  authorProfilePicture: PropTypes.string, // Dodany prop do zdjęcia profilowego
  handleLike: PropTypes.func.isRequired,
  handleCommentChange: PropTypes.func.isRequired,
  newComment: PropTypes.object.isRequired,
  handleAddComment: PropTypes.func.isRequired,
  handleDeletePost: PropTypes.func.isRequired,
};

export default PostItem;
