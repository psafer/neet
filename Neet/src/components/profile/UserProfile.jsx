import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../config/firebaseConfig";
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
  const { userId } = useParams(); // Pobranie ID użytkownika z parametrów URL
  const [posts, setPosts] = useState([]); // Lista postów użytkownika
  const [profileData, setProfileData] = useState(null); // Dane profilu użytkownika
  const [followersCount, setFollowersCount] = useState(0); // Liczba obserwujących
  const [isFollowing, setIsFollowing] = useState(false); // Czy obecny użytkownik obserwuje tego użytkownika
  const [loadingFollowStatus, setLoadingFollowStatus] = useState(true); // Status ładowania informacji o obserwacji
  const navigate = useNavigate(); // Nawigacja między stronami
  const currentUser = auth.currentUser; // Obecnie zalogowany użytkownik

  // Pobranie danych profilu, postów oraz statusu obserwacji
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Pobranie danych profilu użytkownika
        const profileRef = doc(db, "profiles", userId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfileData(profileSnap.data());
        }

        // Pobranie postów użytkownika
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

        // Pobranie liczby obserwujących
        const followersCollection = collection(db, "followers");
        const followersQuery = query(
          followersCollection,
          where("followingId", "==", userId)
        );
        const followersSnapshot = await getDocs(followersQuery);
        setFollowersCount(followersSnapshot.size);

        // Sprawdzenie, czy obecny użytkownik obserwuje tego użytkownika
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

  // Obsługa obserwowania i zaprzestania obserwowania użytkownika
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        // Jeśli użytkownik już obserwuje - usuń obserwację
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
        // Jeśli użytkownik nie obserwuje - dodaj obserwację
        await addDoc(collection(db, "followers"), {
          followerId: currentUser.uid,
          followingId: userId,
        });

        // Dodanie powiadomienia o nowym obserwującym
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

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Błąd podczas obsługi zaobserwowania:", error);
    }
  };

  // Nawigacja do szczegółów posta po kliknięciu
  const handlePostClick = (postId) => {
    navigate("/", { state: { highlightedPostId: postId } });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader />
      <main className="flex flex-1 justify-center items-start pt-14">
        <div className="w-5/6 p-4">
          {profileData && (
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 mx-auto w-full max-w-3xl flex flex-col sm:flex-row items-center text-center sm:text-left">
              {/* Zdjęcie profilowe */}
              <img
                src={profileData.profilePicture || "/mini.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
              />

              {/* Informacje o użytkowniku */}
              <div className="ml-0 sm:ml-6 flex-grow text-center sm:text-left">
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
              <div className="ml-0 sm:ml-auto flex flex-row items-center justify-center sm:space-x-8">
                <div className="flex flex-col items-center w-24">
                  <ClipboardDocumentListIcon className="w-10 h-10 text-orange-500" />
                  <span className="text-lg font-bold">{posts.length}</span>
                  <p className="text-gray-400 text-sm text-center">Posty</p>
                </div>
                <div className="flex flex-col items-center w-24">
                  <UserIcon className="w-10 h-10 text-blue-500" />
                  <span className="text-lg font-bold">{followersCount}</span>
                  <p className="text-gray-400 text-sm text-center">
                    Obserwujący
                  </p>
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
