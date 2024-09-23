import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import HomePageHeader from './HomePageHeader'; // Import the header

const UserProfile = () => {
  const { userId } = useParams(); // Get userId from URL
  const [posts, setPosts] = useState([]);
  const [profileData, setProfileData] = useState(null);

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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader /> {/* Reusing the header from HomePage */}
      
      <main className="flex flex-1 justify-center items-start pt-14">
        <div className="w-5/6 p-4">
          {/* Display user profile data */}
          <h2 className="text-xl font-bold mb-4 text-center">Posty użytkownika</h2>
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
            <p className="text-center text-gray-400">Brak postów do wyświetlenia.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-lg shadow-lg p-6 mb-4 mx-auto max-w-3xl border border-gray-600"
              >
                <p className="text-gray-300">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="mt-4 w-auto h-auto object-contain rounded-lg mx-auto"
                    style={{ maxHeight: "300px" }}
                  />
                )}
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>
                    Opublikowano:{" "}
                    {post.date ? format(post.date.toDate(), "dd.MM.yyyy, HH:mm") : "Brak daty"}
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
