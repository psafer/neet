import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Dodano useNavigate
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import HomePageHeader from "./HomePageHeader"; // Import the header

const UserProfile = () => {
  const { userId } = useParams(); // Get userId from URL
  const [posts, setPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({}); // State to manage current image index for each post
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch the user's profile data
        const profileRef = doc(db, "profiles", userId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfileData(profileSnap.data());
        } else {
          console.log("Brak profilu użytkownika");
        }

        // Fetch the posts for the user
        const postsCollection = collection(db, "posts");
        const q = query(
          postsCollection,
          where("userId", "==", userId),
          orderBy("date", "desc")
        );
        const postsSnapshot = await getDocs(q);
        const userPosts = postsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setPosts(userPosts);
      } catch (error) {
        console.error("Błąd podczas pobierania postów:", error);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Function to handle image navigation (previous image)
  const handlePrevImage = (postId) => {
    setCurrentImageIndex((prevState) => ({
      ...prevState,
      [postId]:
        prevState[postId] === 0
          ? posts.find((post) => post.id === postId).imageUrl.length - 1
          : prevState[postId] - 1,
    }));
  };

  // Function to handle image navigation (next image)
  const handleNextImage = (postId) => {
    setCurrentImageIndex((prevState) => ({
      ...prevState,
      [postId]:
        prevState[postId] ===
        posts.find((post) => post.id === postId).imageUrl.length - 1
          ? 0
          : prevState[postId] + 1,
    }));
  };

  // Funkcja do przekierowania do strony głównej i przekazania ID posta
  const handlePostClick = (postId) => {
    navigate(`/`, { state: { highlightedPostId: postId } });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader /> {/* Reusing the header from HomePage */}
      <main className="flex flex-1 justify-center items-start pt-14">
        <div className="w-5/6 p-4">
          {/* Display user profile data */}
          <h2 className="text-xl font-bold mb-4 text-center">
            Posty użytkownika
          </h2>
          {profileData && (
            <div className="text-center mb-6">
              <img
                src={profileData.profilePicture || "/default-profile.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mb-2"
              />
              <h1 className="text-2xl font-bold">
                {profileData.firstName} {profileData.lastName}
              </h1>
            </div>
          )}
          {posts.length === 0 ? (
            <p className="text-center text-gray-400">
              Brak postów do wyświetlenia.
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-lg shadow-lg p-6 mb-4 mx-auto max-w-3xl border border-gray-600 cursor-pointer"
                onClick={() => handlePostClick(post.id)} // Obsługa kliknięcia na post
              >
                <p className="text-gray-300">{post.content}</p>

                {/* Display multiple images with navigation arrows */}
                {post.imageUrl && post.imageUrl.length > 0 && (
                  <div className="relative mt-4">
                    <img
                      src={post.imageUrl[currentImageIndex[post.id] || 0]}
                      alt={`Post Image ${currentImageIndex[post.id] + 1 || 1}`}
                      className="w-auto h-64 object-contain rounded-lg mx-auto transition duration-500 ease-in-out transform"
                    />

                    {/* Navigation arrows */}
                    {post.imageUrl.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Zapobiega przekierowaniu przy nawigacji obrazem
                            handlePrevImage(post.id);
                          }}
                          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
                        >
                          &#8592;
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Zapobiega przekierowaniu przy nawigacji obrazem
                            handleNextImage(post.id);
                          }}
                          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
                        >
                          &#8594;
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>
                    Opublikowano:{" "}
                    {post.date
                      ? format(post.date.toDate(), "dd.MM.yyyy, HH:mm")
                      : "Brak daty"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
