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
  deleteDoc,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import HomePageHeader from "./HomePageHeader";
import PostForm from "./PostForm";
import PostItem from "./PostItem";
import { useLocation } from "react-router-dom";
import ScrollToTopButton from "./ScrollToTopButton";
import FilterPosts from "./FilterPosts";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [profiles, setProfiles] = useState({}); // Nowy stan przechowujący dane profili użytkowników
  const location = useLocation();
  const highlightedPostId = location.state?.highlightedPostId || null;

  useEffect(() => {
    fetchPosts();
    fetchProfiles(); // Pobranie wszystkich profili przy uruchomieniu

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfilePicture(profileData.profilePicture);
        }

        const notificationsRef = collection(
          db,
          "notifications",
          currentUser.uid,
          "userNotifications"
        );
        const q = query(notificationsRef, orderBy("date", "desc"));

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

  // Funkcja pobierająca wszystkie profile użytkowników
  const fetchProfiles = async () => {
    const profilesCollection = collection(db, "profiles");
    const profilesSnapshot = await getDocs(profilesCollection);
    const profilesData = {};
    profilesSnapshot.forEach((doc) => {
      profilesData[doc.id] = doc.data();
    });
    setProfiles(profilesData);
  };

  // Funkcja pobierająca posty
  const fetchPosts = async () => {
    try {
      const postsCollection = collection(db, "posts");
      const q = query(postsCollection, orderBy("date", "desc"));
      const postsSnapshot = await getDocs(q);
      const postsData = postsSnapshot.docs.map((postDoc) => ({
        ...postDoc.data(),
        id: postDoc.id,
      }));

      setPosts(postsData);
    } catch (error) {
      console.error("Błąd podczas pobierania postów:", error);
    }
  };

  // Funkcja zwracająca imię i nazwisko autora na podstawie userId
  const getAuthorName = (userId) => {
    const authorData = profiles[userId];
    if (authorData) {
      return `${authorData.firstName} ${authorData.lastName}`;
    }
    return "Nieznany Użytkownik";
  };

  // Filtr postów w zależności od ustawionego filtra
  const filteredPosts = posts.filter((post) => {
    if (filter === "all") return true;
    if (filter === "friends") return post.userId && post.userId !== user.uid;
    return true;
  });

  useEffect(() => {
    if (highlightedPostId) {
      const postElement = document.getElementById(highlightedPostId);
      if (postElement) {
        postElement.scrollIntoView({ behavior: "smooth" });
        postElement.classList.add("highlighted-post");
        setTimeout(() => {
          postElement.classList.remove("highlighted-post");
        }, 3000);
      }
    }
  }, [posts, highlightedPostId]);

  const handleSubmitPost = async (content, imageUrl, videoUrl, audioUrl) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "posts"), {
        content,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        audioUrl: audioUrl || null,
        date: serverTimestamp(),
        userId: user.uid, // Tylko userId, bez pełnych danych autora
        profilePicture: profilePicture || null,
        likes: [],
      });

      fetchPosts();
      alert("Post został dodany pomyślnie!");
    } catch (error) {
      console.error("Błąd podczas dodawania posta:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      fetchPosts();
      alert("Post został usunięty");
    } catch (error) {
      console.error("Błąd podczas usuwania posta:", error);
    }
  };

  const handleEditPost = (postId) => {
    alert(`Edytuj post o ID: ${postId}`);
  };

  const handleLike = async (postId) => {
    if (!user) return;

    const postRef = doc(db, "posts", postId);
    const postSnapshot = await getDoc(postRef);

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data();
      const hasLiked = postData.likes.includes(user.uid);

      if (!hasLiked) {
        await updateDoc(postRef, {
          likes: [...postData.likes, user.uid],
        });

        const notificationRef = collection(
          db,
          "notifications",
          postData.userId,
          "userNotifications"
        );
        const userProfileRef = doc(db, "profiles", user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        let userFullName = "Ktoś";
        if (userProfileSnap.exists()) {
          const profileData = userProfileSnap.data();
          userFullName = `${profileData.firstName} ${profileData.lastName}`;
        }

        await addDoc(notificationRef, {
          message: `${userFullName} polubił Twój post`,
          postId,
          date: serverTimestamp(),
          read: false,
        });
      } else {
        await updateDoc(postRef, {
          likes: postData.likes.filter((id) => id !== user.uid),
        });
      }
      fetchPosts();
    }
  };

  const handleCommentChange = (postId, e) => {
    setNewComment((prev) => ({ ...prev, [postId]: e.target.value }));
  };

  const handleAddComment = async (postId) => {
    if (!newComment[postId] || newComment[postId].trim() === "") return;

    const commentsRef = collection(db, "posts", postId, "comments");

    try {
      const docRef = doc(db, "profiles", user.uid);
      const docSnap = await getDoc(docRef);

      let authorName = "Anonim";
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        authorName = `${profileData.firstName} ${profileData.lastName}`;
      }

      const newCommentData = {
        content: newComment[postId],
        author: authorName,
        date: serverTimestamp(),
      };

      await addDoc(commentsRef, newCommentData);

      const postRef = doc(db, "posts", postId);
      const postSnapshot = await getDoc(postRef);
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

      setNewComment((prev) => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch (error) {
      console.error("Błąd podczas dodawania komentarza:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader />
      <div className="flex flex-1 justify-center items-start pt-16">
        <main className="w-5/6 p-4">
          {user && (
            <div className="w-full flex flex-col items-center mb-4">
              <FilterPosts currentFilter={filter} setFilter={setFilter} />
              <PostForm
                user={user}
                profilePicture={profilePicture}
                handleSubmitPost={handleSubmitPost}
              />
            </div>
          )}
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <div id={post.id} key={post.id}>
                <PostItem
                  post={post}
                  user={user}
                  authorName={getAuthorName(post.userId)}
                  handleLike={handleLike}
                  handleCommentChange={handleCommentChange}
                  newComment={newComment}
                  handleAddComment={handleAddComment}
                  handleDeletePost={handleDeletePost}
                  handleEditPost={handleEditPost}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default HomePage;
