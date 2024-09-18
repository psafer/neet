import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsCollection = collection(db, "posts");
      const postsSnapshot = await getDocs(postsCollection);
      const postsData = postsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })); // Dodajemy id do każdego posta
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
    <div className="container mx-auto p-4">
      <header className="bg-gray-100 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-3xl font-bold">Neet.</h1>
        <nav>
          {user && ( // Wyświetlaj przycisk tylko, gdy user jest zalogowany
            <button
              onClick={handleSignOut}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Wyloguj
            </button>
          )}
        </nav>
      </header>

      <main className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <p className="text-gray-600">{post.content}</p>
              {/* Dodaj tutaj informacje o autorze, dacie itp. */}
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-gray-200 p-4 mt-8 text-center">
        <p>&copy; 2024 Neet. Social Network</p>
      </footer>
    </div>
  );
};

export default HomePage;
