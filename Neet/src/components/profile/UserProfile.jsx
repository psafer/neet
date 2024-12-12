import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import HomePageHeader from "../header/HomePageHeader";

const UserProfile = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollowStatus, setLoadingFollowStatus] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profileRef = doc(db, "profiles", userId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfileData(profileSnap.data());
        }

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

        const followRef = collection(db, "followers");
        const followQuery = query(
          followRef,
          where("followerId", "==", currentUser.uid),
          where("followingId", "==", userId)
        );
        const followSnapshot = await getDocs(followQuery);
        if (!followSnapshot.empty) {
          setIsFollowing(true);
        }
        setLoadingFollowStatus(false);
      } catch (error) {
        console.error("Błąd podczas pobierania profilu lub postów:", error);
      }
    };

    if (userId && currentUser) {
      fetchUserProfile();
    }
  }, [userId, currentUser]);

  const handlePrevImage = (postId) => {
    setCurrentImageIndex((prevState) => ({
      ...prevState,
      [postId]:
        prevState[postId] === 0
          ? posts.find((post) => post.id === postId).imageUrl.length - 1
          : prevState[postId] - 1,
    }));
  };

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

  const handlePostClick = (postId) => {
    navigate(`/`, { state: { highlightedPostId: postId } });
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        const followRef = collection(db, "followers");
        const followQuery = query(
          followRef,
          where("followerId", "==", currentUser.uid),
          where("followingId", "==", userId)
        );
        const followSnapshot = await getDocs(followQuery);
        followSnapshot.forEach((docSnap) => {
          deleteDoc(doc(db, "followers", docSnap.id));
        });
        setIsFollowing(false);
      } else {
        await addDoc(collection(db, "followers"), {
          followerId: currentUser.uid,
          followingId: userId,
        });
        setIsFollowing(true);

        const followerProfileRef = doc(db, "profiles", currentUser.uid);
        const followerProfileSnap = await getDoc(followerProfileRef);

        let followerName = "Nieznany użytkownik";
        if (followerProfileSnap.exists()) {
          const profileData = followerProfileSnap.data();
          followerName = `${profileData.firstName} ${profileData.lastName}`;
        }

        const notificationsRef = collection(
          db,
          "notifications",
          userId,
          "userNotifications"
        );
        await addDoc(notificationsRef, {
          message: `${followerName} zaobserwował Cię!`,
          type: "follow",
          followerId: currentUser.uid,
          date: new Date(),
          read: false,
        });
      }
    } catch (error) {
      console.error("Błąd podczas obsługi zaobserwowania:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader />
      <main className="flex flex-1 justify-center items-start pt-14">
        <div className="w-5/6 p-4">
          <h2 className="text-xl font-bold mb-4 text-center">
            Posty użytkownika
          </h2>
          {profileData && (
            <div className="text-center mb-6">
              <img
                src={profileData.profilePicture || "/mini.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto mb-2"
              />
              <h1 className="text-2xl font-bold">
                {profileData.firstName} {profileData.lastName}
              </h1>
              {!loadingFollowStatus && userId !== currentUser.uid && (
                <button
                  onClick={handleFollow}
                  className={`mt-4 px-6 py-2 rounded-lg ${
                    isFollowing
                      ? "bg-gray-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {isFollowing ? "Zaobserwowany" : "Zaobserwuj"}
                </button>
              )}
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
                onClick={() => handlePostClick(post.id)}
              >
                <p className="text-gray-300">{post.content}</p>

                {post.imageUrl &&
                  Array.isArray(post.imageUrl) &&
                  post.imageUrl.length > 0 && (
                    <div className="relative mt-4">
                      <img
                        src={post.imageUrl[currentImageIndex[post.id] || 0]}
                        alt={`Post Image ${
                          currentImageIndex[post.id] + 1 || 1
                        }`}
                        className="w-auto h-64 object-contain rounded-lg mx-auto transition duration-500 ease-in-out transform"
                      />
                      {post.imageUrl.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage(post.id);
                            }}
                            className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
                          >
                            &#8592;
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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

                {post.videoUrl &&
                  typeof post.videoUrl === "string" &&
                  post.videoUrl.trim() !== "" &&
                  post.videoUrl[0] !== "" && (
                    <video
                      controls
                      className="w-full rounded-lg mt-4"
                      src={post.videoUrl[0]}
                    />
                  )}

                {post.audioUrl &&
                  typeof post.audioUrl === "string" &&
                  post.audioUrl.trim() !== "" &&
                  post.audioUrl[0] !== "" && (
                    <audio
                      controls
                      className="w-full rounded-lg mt-4"
                      src={post.audioUrl[0]}
                    />
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
