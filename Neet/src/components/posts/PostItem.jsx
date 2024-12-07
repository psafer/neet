import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import CommentSection from "./CommentSection";
import PropTypes from "prop-types";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { orderBy } from "lodash";

const PostItem = ({
  post,
  user,
  handleLike,
  handleCommentChange,
  newComment,
  handleAddComment,
  handleDeletePost,
  authorName,
  authorProfilePicture,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [comments, setComments] = useState([]); // Nowy stan dla komentarzy

  // Pobieranie statusu obserwacji użytkownika
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

  // Pobieranie komentarzy w czasie rzeczywistym
  useEffect(() => {
    const commentsRef = collection(db, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [post.id]);

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
            src={authorProfilePicture}
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
            {authorName || "Anonim"}
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
              className="w-auto h-64 object-contain rounded-lg mx-auto"
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
              {comments.length}
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
            post={{ ...post, comments }}
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
    userId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    imageUrl: PropTypes.arrayOf(PropTypes.string),
    comments: PropTypes.array,
    likes: PropTypes.arrayOf(PropTypes.string).isRequired,
    date: PropTypes.object,
  }).isRequired,
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }),
  authorName: PropTypes.string,
  authorProfilePicture: PropTypes.string,
  handleLike: PropTypes.func.isRequired,
  handleCommentChange: PropTypes.func.isRequired,
  newComment: PropTypes.object.isRequired,
  handleAddComment: PropTypes.func.isRequired,
  handleDeletePost: PropTypes.func.isRequired,
};

export default PostItem;
