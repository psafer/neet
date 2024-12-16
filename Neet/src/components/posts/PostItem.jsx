import { useState, useEffect, useRef } from "react";
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

const PostItem = ({
  post,
  user,
  handleLike,
  handleCommentChange,
  newComment,
  handleAddComment,
  handleDeleteComment,
  handleDeletePost,
  authorName,
  authorProfilePicture,
}) => {
  // Stan do obsługi bieżącego obrazu w galerii
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Stan do obsługi widoczności formularza komentarzy
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Stan dla rozwijanej listy opcji (dropdown)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Stan do sprawdzania, czy użytkownik obserwuje autora posta
  const [isFollowing, setIsFollowing] = useState(false);

  // Stan przechowujący komentarze w czasie rzeczywistym
  const [comments, setComments] = useState([]);

  // Stan do obsługi modala dla powiększania obrazu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  // Referencja do dropdowna
  const dropdownRef = useRef(null);

  // Pobranie statusu obserwacji użytkownika
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
    const q = query(commentsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [post.id]);

  // Obsługa kliknięcia poza dropdownem
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Zamknięcie dropdowna
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obsługa nawigacji do poprzedniego obrazu
  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? post.imageUrl.length - 1 : prevIndex - 1
    );
  };

  // Obsługa nawigacji do następnego obrazu
  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === post.imageUrl.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Obsługa usunięcia posta
  const handleDelete = () => {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć post?");
    if (confirmed) {
      handleDeletePost(post.id);
    }
  };

  // Obsługa wyświetlania formularza komentarzy
  const toggleCommentForm = () => {
    setShowCommentForm((prevState) => !prevState);
  };

  // Obsługa rozwijania dropdowna
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Otwieranie modala z obrazem
  const openModal = (imageUrl) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  // Zamknięcie modala
  const closeModal = () => {
    setIsModalOpen(false);
    setModalImage(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mx-auto max-w-3xl border border-gray-600 relative">
      {/* Nagłówek posta z autorem */}
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

          {/* Dropdown z opcjami */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute bg-gray-700 text-white rounded shadow-lg top-full mt-2 w-40 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                to={`/profile/${post.userId}`}
                className="block w-full text-left px-4 py-2 hover:bg-gray-600"
                onClick={() => setIsDropdownOpen(false)}
              >
                Profil
              </Link>
            </div>
          )}
        </div>

        {/* Opcja usunięcia posta */}
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

      {/* Treść posta */}
      <div className="p-4 border border-gray-600 rounded-lg">
        <p className="text-gray-300">{post.content}</p>

        {/* Galeria obrazów */}
        {post.imageUrl && post.imageUrl.length > 0 && (
          <div className="relative mt-4">
            <img
              src={post.imageUrl[currentImageIndex]}
              alt={`Post Image ${currentImageIndex + 1}`}
              className="w-auto h-64 object-contain rounded-lg mx-auto cursor-pointer"
              onClick={() => openModal(post.imageUrl[currentImageIndex])}
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

        {/* Sekcja lajków i komentarzy */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            {/* Lajki */}
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
            {/* Komentarze */}
            <button
              onClick={toggleCommentForm}
              className="flex items-center text-sm text-gray-500 ml-4"
            >
              <i className="fa-solid fa-comment mr-1"></i>
              {comments.length}
            </button>
          </div>
          {/* Data publikacji */}
          <div className="mt-2 text-sm text-gray-500">
            Opublikowano:{" "}
            {post.date
              ? format(post.date.toDate(), "dd.MM.yyyy, HH:mm")
              : "Brak daty"}
          </div>
        </div>

        {/* Sekcja komentarzy */}
        {showCommentForm && (
          <CommentSection
            post={{ ...post, comments }}
            newComment={newComment}
            handleCommentChange={handleCommentChange}
            handleAddComment={handleAddComment}
            handleDeleteComment={handleDeleteComment}
            currentUserId={user.uid}
          />
        )}
      </div>

      {/* Modal powiększania obrazu */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <img
            src={modalImage}
            alt="Modal"
            className="max-w-full max-h-full rounded"
          />
          <button
            className="absolute top-5 right-5 text-white text-2xl"
            onClick={closeModal}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

PostItem.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    imageUrl: PropTypes.arrayOf(PropTypes.string),
    audioUrl: PropTypes.arrayOf(PropTypes.string),
    videoUrl: PropTypes.arrayOf(PropTypes.string),
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
  handleDeleteComment: PropTypes.func.isRequired,
  handleDeletePost: PropTypes.func.isRequired,
};

export default PostItem;
