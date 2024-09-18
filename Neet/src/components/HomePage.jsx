import { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      const postsCollection = collection(db, "posts");
      const postsSnapshot = await getDocs(postsCollection);
      const postsData = postsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setPosts(postsData);
    };

    fetchPosts();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-gray-900 p-1 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          {/* Logo */}
          <img
            src="/logo.png"
            alt="Logo"
            className="w-16 h-16 mr-4 rounded-full"
          />
        </div>
        {user && (
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Wyloguj
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl mt-8 p-4">
        <h2 className="text-2xl font-semibold text-center text-orange-400 mb-6">
          Posty społeczności
        </h2>

        {/* Post Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400">
              Brak postów do wyświetlenia.
            </p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <h3 className="text-xl font-bold text-orange-500 mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-300">{post.content}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {/* Jeśli chcesz dodać więcej informacji, np. datę lub autora */}
                  Opublikowano przez {post.author || "Anonim"} |{" "}
                  {post.date || "Brak daty"}
                </p>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 p-4 mt-8 text-center">
        <p className="text-gray-500">&copy; 2024 Neet. Social Network</p>
      </footer>
    </div>
  );
};

export default HomePage;
