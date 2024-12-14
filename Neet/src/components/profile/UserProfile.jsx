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
import { UserIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import HomePageHeader from "../header/HomePageHeader";

const UserProfile = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
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

        const followersCollection = collection(db, "followers");
        const followersQuery = query(
          followersCollection,
          where("followingId", "==", userId)
        );
        const followersSnapshot = await getDocs(followersQuery);
        setFollowersCount(followersSnapshot.size);

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
        setFollowersCount((prev) => prev - 1);
      } else {
        await addDoc(collection(db, "followers"), {
          followerId: currentUser.uid,
          followingId: userId,
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Błąd podczas obsługi zaobserwowania:", error);
    }
  };

  const handlePostClick = (postId) => {
    navigate("/", { state: { highlightedPostId: postId } });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader />
      <main className="flex flex-1 justify-center items-start pt-14">
        <div className="w-5/6 p-4">
          {profileData && (
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 mx-auto max-w-3xl flex items-center">
              {/* Zdjęcie profilowe */}
              <img
                src={profileData.profilePicture || "/mini.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
              />

              {/* Informacje o użytkowniku */}
              <div className="ml-6 flex-grow">
                <h1 className="text-3xl font-bold mb-2">
                  {profileData.firstName} {profileData.lastName}
                </h1>
                <p className="text-gray-400 text-sm mb-4">
                  {profileData.bio || "Ten użytkownik nie ma jeszcze opisu."}
                </p>
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

              {/* Ikony i liczby */}
              <div className="ml-auto flex items-center space-x-8">
                <div className="flex flex-col items-center">
                  <ClipboardDocumentListIcon className="w-10 h-10 text-orange-500" />
                  <span className="text-lg font-bold">{posts.length}</span>
                  <p className="text-gray-400 text-sm">Posty</p>
                </div>
                <div className="flex flex-col items-center">
                  <UserIcon className="w-10 h-10 text-blue-500" />
                  <span className="text-lg font-bold">{followersCount}</span>
                  <p className="text-gray-400 text-sm">Obserwujący</p>
                </div>
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold mb-4 text-center">
            Posty użytkownika
          </h2>
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
                    <div className="mt-4">
                      <img
                        src={post.imageUrl[0]}
                        alt="Post content"
                        className="w-full rounded-lg object-contain"
                      />
                    </div>
                  )}
                {post.videoUrl &&
                  Array.isArray(post.videoUrl) &&
                  post.videoUrl.length > 0 && (
                    <video
                      controls
                      className="w-full rounded-lg mt-4"
                      src={post.videoUrl[0]}
                    />
                  )}
                {post.audioUrl &&
                  Array.isArray(post.audioUrl) &&
                  post.audioUrl.length > 0 && (
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
