import { useState, useEffect, useRef } from "react";
import { db, auth, storage } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import HomePageHeader from "./HomePageHeader"; // Import HomePageHeader

const HomePage = () => {
  // **Stan aplikacji**
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
  const [newComment, setNewComment] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState({}); // **Zmieniono na obiekt dla obsługi wielu pickerów**

  // **Referencje do elementów DOM**
  const formRef = useRef(null);
  const inputFileRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // **Funkcja do zamykania formularza i wszystkich emoji pickerów po kliknięciu poza**
  const handleClickOutside = (e) => {
    if (formRef.current && !formRef.current.contains(e.target)) {
      setIsFormOpen(false);
    }
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
      setShowEmojiPicker({});
    }
  };

  // **Efekt nasłuchujący kliknięcia poza formularzem i emoji pickerami**
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // **Efekt do pobierania postów i nasłuchiwania stanu uwierzytelnienia użytkownika**
  useEffect(() => {
    fetchPosts();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // **Pobieranie danych profilu użytkownika**
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfilePicture(profileData.profilePicture);
        }

        // **Aktualizacja w czasie rzeczywistym dla powiadomień**
        const notificationsRef = collection(
          db,
          "notifications",
          currentUser.uid,
          "userNotifications"
        );
        const q = query(notificationsRef, orderBy("date", "desc"));

        // **Nasłuchiwanie zmian w powiadomieniach w czasie rzeczywistym**
        const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
          const notificationsData = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          const unread = notificationsData.filter(
            (notif) => !notif.read
          ).length;
          setUnreadCount(unread);
        });

        return () => unsubscribeNotifications();
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [unreadCount]);

  // **Funkcja do pobierania postów z Firestore wraz z komentarzami**
  const fetchPosts = async () => {
    try {
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("date", "desc"));
      const postsSnapshot = await getDocs(q);
      const postsData = await Promise.all(
        postsSnapshot.docs.map(async (doc) => {
          const postData = doc.data();
          const commentsRef = collection(db, "posts", doc.id, "comments");
          const commentsSnapshot = await getDocs(
            query(commentsRef, orderBy("date", "asc"))
          );
          const commentsData = commentsSnapshot.docs.map((commentDoc) => ({
            ...commentDoc.data(),
            id: commentDoc.id,
          }));
          return {
            ...postData,
            id: doc.id,
            comments: commentsData,
          };
        })
      );

      setPosts(postsData);
    } catch (error) {
      console.error("Błąd podczas pobierania postów:", error);
    }
  };

  // **Obsługa zmiany wartości w polu tekstowym nowego posta**
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prevPost) => ({ ...prevPost, [name]: value }));
  };

  // **Obsługa kliknięcia emoji w EmojiPicker**
  const handleEmojiClick = (emojiData, emojiObject, postId = null) => {
    const emoji = emojiObject?.emoji || emojiData?.emoji;

    if (postId) {
      // Dodanie emoji do komentarza
      setNewComment((prev) => ({
        ...prev,
        [postId]: (prev[postId] || "") + emoji,
      }));
    } else {
      // Dodanie emoji do posta
      setNewPost((prevPost) => ({
        ...prevPost,
        content: prevPost.content + emoji,
      }));
    }
  };

  // **Obsługa zmiany pliku obrazu w nowym poście**
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setNewPost((prevPost) => ({
        ...prevPost,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // **Obsługa przesyłania nowego posta**
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = null;

    // **Przesyłanie obrazu do Firebase Storage, jeśli istnieje**
    if (newPost.image) {
      const storageRef = ref(storage, `posts/${newPost.image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, newPost.image);
      const snapshot = await uploadTask;
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    try {
      // **Pobieranie danych autora posta**
      const docRef = doc(db, "profiles", user.uid);
      const docSnap = await getDoc(docRef);

      let authorName = "Anonim";
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        authorName = `${profileData.firstName} ${profileData.lastName}`;
      }

      // **Dodawanie nowego posta do Firestore**
      const newPostRef = await addDoc(collection(db, "posts"), {
        content: newPost.content,
        imageUrl: imageUrl || null,
        author: authorName,
        date: serverTimestamp(),
        userId: user.uid,
        profilePicture: profilePicture || null,
        likes: [],
      });

      // **Aktualizacja stanu użytkownika po dodaniu posta**
      const currentUser = auth.currentUser;
      if (currentUser) {
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setUser({ ...currentUser, ...profileData }); // Aktualizacja stanu użytkownika
        }
      }

      // **Resetowanie formularza po dodaniu posta**
      setNewPost({ content: "", image: null, imagePreview: null });
      setUploading(false);
      setIsFormOpen(false);
      fetchPosts();
      alert("Post został dodany pomyślnie!");
    } catch (error) {
      console.error("Błąd podczas dodawania posta:", error);
      setUploading(false);
    }
  };

  // **Obsługa polubienia posta**
  const handleLike = async (postId) => {
    if (!user) return;

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data();
      const hasLiked = postData.likes.includes(user.uid);

      if (!hasLiked) {
        // **Dodanie użytkownika do listy polubień**
        await updateDoc(postRef, {
          likes: [...postData.likes, user.uid],
        });

        // **Pobieranie danych profilu użytkownika, który polubił post**
        const userProfileRef = doc(db, "profiles", user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        let userFullName = "Ktoś";
        if (userProfileSnap.exists()) {
          const profileData = userProfileSnap.data();
          userFullName = `${profileData.firstName} ${profileData.lastName}`;
        }

        // **Dodanie powiadomienia dla autora posta**
        const notificationRef = collection(
          db,
          "notifications",
          postData.userId,
          "userNotifications"
        );
        await addDoc(notificationRef, {
          message: `${userFullName} polubił Twój post`,
          postId,
          date: serverTimestamp(),
          read: false,
        });
      } else {
        // **Usunięcie użytkownika z listy polubień**
        await updateDoc(postRef, {
          likes: postData.likes.filter((id) => id !== user.uid),
        });
      }
      fetchPosts();
    }
  };

  // **Obsługa zmiany wartości w polu komentarza**
  const handleCommentChange = (postId, e) => {
    setNewComment((prev) => ({ ...prev, [postId]: e.target.value }));
  };

  // **Dodawanie nowego komentarza do posta**
  const handleAddComment = async (postId) => {
    if (!newComment[postId] || newComment[postId].trim() === "") return;

    const commentsRef = collection(db, "posts", postId, "comments");

    try {
      // **Pobieranie danych profilu komentującego użytkownika**
      const docRef = doc(db, "profiles", user.uid);
      const docSnap = await getDoc(docRef);

      let authorName = "Anonim";
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        authorName = `${profileData.firstName} ${profileData.lastName}`;
      }

      // **Tworzenie nowego obiektu komentarza**
      const newCommentData = {
        content: newComment[postId],
        author: authorName,
        date: serverTimestamp(), // **Użycie serverTimestamp**
      };

      // **Dodanie nowego komentarza do subkolekcji**
      await addDoc(commentsRef, newCommentData);

      // **Wysyłanie powiadomienia do autora posta, jeśli komentujący nie jest autorem**
      const postRef = doc(db, "posts", postId);
      const postSnapshot = await getDoc(postRef);
      if (postSnapshot.exists()) {
        const postData = postSnapshot.data();
        if (postData.userId !== user.uid) {
          const notificationRef = collection(
            db,
            "notifications",
            postData.userId,
            "userNotifications"
          );
          await addDoc(notificationRef, {
            message: `${authorName} skomentował Twój post`,
            postId,
            date: serverTimestamp(),
            read: false,
          });
        }
      }

      // **Resetowanie pola komentarza po dodaniu**
      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch (error) {
      console.error("Błąd podczas dodawania komentarza:", error);
    }
  };

  // **Obsługa zdarzenia naciśnięcia klawisza w polu komentarza**
  const handleKeyDown = (postId, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddComment(postId);
    }
  };

  // **Toggle rozwijania i zwijania komentarzy**
  const toggleExpandComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* **Nagłówek strony głównej** */}
      <HomePageHeader /> {/* Użyj HomePageHeader */}
      <div className="flex flex-1 justify-center items-start pt-16">
        <main className="w-5/6 p-4">
          {/* **Formularz dodawania nowego posta** */}
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
                onClick={() => setIsFormOpen(true)}
                onFocus={() => setIsFormOpen(true)}
              />
              {isFormOpen && (
                <>
                  {/* **Przyciski do dodawania obrazu i emoji** */}
                  <div className="flex items-center">
                    <span className="mr-2 ml-1 text-orange-300">
                      Dodaj do posta
                    </span>
                    <button
                      type="button"
                      onClick={() => inputFileRef.current.click()}
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
                    <button
                      type="button"
                      onClick={() =>
                        setShowEmojiPicker((prev) => ({
                          ...prev,
                          post: !prev.post, // **Picker dla posta**
                        }))
                      }
                      className="p-2 bg-gray-700 text-white rounded flex items-center ml-2"
                    >
                      <i className="fa-solid fa-smile"></i>
                    </button>

                    {/* **Emoji Picker dla posta** */}
                    {showEmojiPicker.post && (
                      <div ref={emojiPickerRef} className="absolute z-50">
                        <EmojiPicker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>
                  {/* **Podgląd dodanego obrazu** */}
                  {newPost.imagePreview && (
                    <img
                      src={newPost.imagePreview}
                      alt="Podgląd"
                      className="mt-2 w-full h-auto object-cover rounded"
                      style={{ maxHeight: "200px", opacity: 0.4 }}
                    />
                  )}
                  {/* **Przycisk do dodania posta** */}
                  <button
                    onClick={handleSubmit}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full mt-2"
                    disabled={uploading}
                  >
                    {uploading ? "Wysyłanie..." : "Dodaj Post"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* **Lista postów** */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <p className="text-center text-gray-400">
                Brak postów do wyświetlenia.
              </p>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg shadow-lg p-6 mx-auto max-w-3xl border border-gray-600 relative"
                >
                  {/* **Informacje o autorze posta** */}
                  <div className="flex items-center mb-4">
                    {post.profilePicture && (
                      <img
                        src={post.profilePicture}
                        alt="Autor"
                        className="w-9 h-9 rounded-full mr-2 mb-2"
                      />
                    )}
                    <p className="text-lg font-semibold text-white">
                      <Link to={`/profile/${post.userId}`}>
                        {/* Link do profilu */}
                        {post.author || "Anonim"}
                      </Link>
                    </p>
                  </div>
                  {/* **Zawartość posta** */}
                  <div className="p-4 border border-gray-600 rounded-lg">
                    {/* **Tytuł posta** */}
                    {post.title && (
                      <h3 className="text-xl font-bold text-orange-500 mb-2">
                        {post.title}
                      </h3>
                    )}
                    {/* **Treść posta** */}
                    <p className="text-gray-300">{post.content}</p>
                    {/* **Obraz w poście, jeśli istnieje** */}
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="mt-4 w-auto h-auto object-contain rounded-lg mx-auto"
                        style={{ maxHeight: "300px" }}
                      />
                    )}
                    {/* **Przyciski do polubienia i komentowania** */}
                    <div className="flex items-center justify-between mt-2">
                      {/* **Przycisk like** */}
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
                      {/* **Data publikacji posta** */}
                      <div className="mt-2 text-sm text-gray-500">
                        Opublikowano:{" "}
                        {post.date
                          ? format(post.date.toDate(), "dd.MM.yyyy, HH:mm")
                          : "Brak daty"}
                      </div>
                      {/* **Przycisk do wyświetlania pola komentarza** */}
                      <button
                        onClick={() =>
                          setShowCommentInput((prev) => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }))
                        }
                        className="text-gray-400 hover:text-orange-500"
                      >
                        <i className="fa-solid fa-comment"></i>
                      </button>
                    </div>
                    {/* **Pole do dodawania komentarza** */}
                    {showCommentInput[post.id] && (
                      <div className="mt-2 flex relative">
                        <input
                          type="text"
                          placeholder="Twój komentarz..."
                          value={newComment[post.id] || ""}
                          onChange={(e) => handleCommentChange(post.id, e)}
                          onKeyDown={(e) => handleKeyDown(post.id, e)}
                          className="flex-grow p-2 bg-gray-700 text-white rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowEmojiPicker((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                          className="bg-transparent text-orange-500 hover:bg-gray-600 rounded p-2 ml-2"
                        >
                          <i className="fa-solid fa-smile"></i>
                        </button>
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-transparent text-orange-500 hover:bg-gray-600 rounded p-2 ml-2"
                        >
                          <i className="fa-solid fa-paper-plane"></i>
                        </button>

                        {/* **Emoji Picker dla komentarzy** */}
                        {showEmojiPicker[post.id] && (
                          <div
                            ref={emojiPickerRef}
                            className="absolute z-50 bottom-full mb-2 right-0"
                          >
                            <EmojiPicker
                              onEmojiClick={(emojiData, emojiObject) =>
                                handleEmojiClick(
                                  emojiData,
                                  emojiObject,
                                  post.id
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {/* **Lista komentarzy** */}
                    {post.comments.length > 0 && (
                      <div className="mt-4 border-t border-gray-600 pt-2">
                        {post.comments
                          .slice()
                          .reverse()
                          .slice(
                            0,
                            expandedComments[post.id] ? post.comments.length : 3
                          )
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="text-gray-300 mb-2"
                            >
                              <strong>{comment.author}:</strong>{" "}
                              {comment.content}{" "}
                              <span className="text-gray-500 text-sm">
                                {comment.date
                                  ? format(
                                      comment.date.toDate(),
                                      "dd.MM.yyyy, HH:mm"
                                    )
                                  : ""}
                              </span>
                            </div>
                          ))}
                        {/* **Przycisk do rozwijania i zwijania komentarzy** */}
                        {post.comments.length > 3 && (
                          <button
                            onClick={() => toggleExpandComments(post.id)}
                            className="text-orange-500"
                          >
                            {expandedComments[post.id]
                              ? "Zwiń komentarze"
                              : "Pokaż więcej komentarzy"}
                          </button>
                        )}
                      </div>
                    )}
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
