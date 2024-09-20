import { useState, useEffect, useRef } from "react";
import { db, auth, storage } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { format } from "date-fns"; // Opcjonalnie, jeśli używasz date-fns

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newPost, setNewPost] = useState({
    content: "",
    image: null,
    imagePreview: null,
  });
  const [uploading, setUploading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const formRef = useRef(null);
  const inputFileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfilePicture(profileData.profilePicture);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchPosts = async () => {
    try {
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("date", "desc")); // Sortowanie malejąco
      const postsSnapshot = await getDocs(q);
      const postsData = postsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      setPosts(postsData);
    } catch (error) {
      console.error("Błąd podczas pobierania postów:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prevPost) => ({ ...prevPost, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setNewPost((prevPost) => ({
        ...prevPost,
        image: file,
        imagePreview: URL.createObjectURL(file), // Generowanie URL podglądu
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = null;

    if (newPost.image) {
      const storageRef = ref(storage, `posts/${newPost.image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, newPost.image);
      const snapshot = await uploadTask;
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    try {
      await addDoc(collection(db, "posts"), {
        content: newPost.content,
        imageUrl: imageUrl || null,
        author: user.displayName || "Anonim",
        date: serverTimestamp(), // Użycie serverTimestamp
        userId: user.uid,
        profilePicture: profilePicture || null,
      });

      setNewPost({ content: "", image: null, imagePreview: null });
      setUploading(false);
      setIsFormOpen(false);
      fetchPosts();
      alert("Post został dodany!");
    } catch (error) {
      console.error("Błąd podczas dodawania postu:", error);
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
    }
  };

  const handleProfileClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsMenuOpen(false);
    }
    if (formRef.current && !formRef.current.contains(e.target)) {
      setIsFormOpen(false); // Zwijanie formularza
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center w-full relative">
        {/* Lewa strona: Logo */}
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full" />
        </div>

        {/* Środek: napis.png */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <img src="/napis.png" alt="Home Page" className="h-10" />
          <p className="text-sm text-gray-400 mt-1">HomePage</p>{" "}
          {/* Dodanie mini napisu */}
        </div>

        {/* Prawa strona: Profil użytkownika i menu */}
        {user && (
          <div className="flex items-center">
            <img
              src={profilePicture || "/default-profile.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full cursor-pointer"
              onClick={handleProfileClick}
            />
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-lg z-50 transition ease-out duration-200"
              >
                <button
                  onClick={() => navigate("/profile")}
                  className="block px-4 py-2 text-white hover:bg-gray-700"
                >
                  Profil
                </button>
                <button
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-white hover:bg-gray-700"
                >
                  Wyloguj
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-1 justify-center items-start">
        <main className="w-5/6 p-4">
          {user && (
            <div
              className="bg-gray-800 p-4 rounded-lg mb-6 mx-auto max-w-3xl"
              ref={formRef}
            >
              <input
                type="text"
                name="content"
                placeholder="Co słychać? Dodaj nowy post..."
                value={newPost.content}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 text-white rounded mb-2 hover:bg-gray-600"
                onClick={() => setIsFormOpen(true)} // Open the form on click
                onFocus={() => setIsFormOpen(true)}
              />
              {isFormOpen && (
                <>
                  <div className="flex items-center">
                    <span className="mr-2 ml-1 text-orange-300">
                      Dodaj do posta
                    </span>
                    <button
                      type="button"
                      onClick={() => inputFileRef.current.click()} // Kliknięcie na ikonę otworzy okno wyboru plików
                      className="p-2 bg-gray-700 text-white rounded flex items-center"
                    >
                      <i className="fa-solid fa-camera"></i>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={inputFileRef}
                      className="hidden"
                    />
                  </div>
                  {newPost.imagePreview && ( // Wyświetlenie podglądu
                    <img
                      src={newPost.imagePreview}
                      alt="Podgląd"
                      className="mt-2 w-full h-auto object-cover rounded"
                      style={{ maxHeight: "200px", opacity: 0.4 }}
                    />
                  )}
                  <button
                    onClick={handleSubmit}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full mt-2"
                    disabled={uploading}
                  >
                    {uploading ? "Dodawanie..." : "Dodaj Post"}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="space-y-6">
            {posts.length === 0 ? (
              <p className="text-center text-gray-400">
                Brak postów do wyświetlenia.
              </p>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg shadow-lg p-6 mx-auto max-w-3xl"
                >
                  <div className="flex items-center mb-4">
                    {post.profilePicture && (
                      <img
                        src={post.profilePicture}
                        alt="Autor"
                        className="w-9 h-9 rounded-full mr-2 mb-2"
                      />
                    )}
                    <p className="text-lg font-semibold text-white">
                      {post.author || "Anonim"}
                    </p>
                  </div>
                  <h3 className="text-xl font-bold text-orange-500 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-300">{post.content}</p>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="mt-4 w-auto h-auto object-contain rounded-lg mx-auto"
                      style={{ maxHeight: "300px" }}
                    />
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    Opublikowano:{" "}
                    {post.date
                      ? format(post.date.toDate(), "dd.MM.yyyy, HH:mm")
                      : "Brak daty"}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
