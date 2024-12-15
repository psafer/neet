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
import { db, auth } from "../../firebaseConfig";
import HomePageHeader from "../header/HomePageHeader";
import PostForm from "../posts/PostForm";
import PostItem from "../posts/PostItem";
import { useLocation } from "react-router-dom";
import ScrollToTopButton from "./ScrollToTopButton";
import FilterPosts from "./FilterPosts";
import ChatPanel from "../chatComponents/ChatPanel"; // Import ChatPanel

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [profiles, setProfiles] = useState({});
  const location = useLocation();
  const highlightedPostId = location.state?.highlightedPostId || null;

  useEffect(() => {
    fetchPosts();
    fetchProfiles();

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

  const fetchProfiles = async () => {
    const profilesCollection = collection(db, "profiles");
    const profilesSnapshot = await getDocs(profilesCollection);
    const profilesData = {};
    profilesSnapshot.forEach((doc) => {
      profilesData[doc.id] = doc.data();
    });
    setProfiles(profilesData);
  };

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

  const getAuthorInfo = (userId) => {
    const authorData = profiles[userId];
    if (authorData) {
      return {
        name: `${authorData.firstName} ${authorData.lastName}`,
        profilePicture: authorData.profilePicture || null,
      };
    }
    return {
      name: "Nieznany Użytkownik",
      profilePicture: null,
    };
  };

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
        userId: user.uid,
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
          postId, // Dodanie ID
          type: "like",
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
      const docRef = doc(db, "profiles", user.uid); // Pobieranie danych autora z kolekcji `profiles`
      const docSnap = await getDoc(docRef);

      let authorName = user.displayName || "Anonim";
      let authorPicture = "/default-avatar.png";

      if (docSnap.exists()) {
        const profileData = docSnap.data();
        authorName = `${profileData.firstName} ${profileData.lastName}`;
        authorPicture = profileData.profilePicture || "/default-avatar.png";
      }

      const newCommentData = {
        content: newComment[postId],
        author: authorName,
        authorId: user.uid,
        authorPicture: authorPicture,
        date: serverTimestamp(),
      };

      // Dodanie komentarza do podkolekcji `comments`
      await addDoc(commentsRef, newCommentData);

      // Tworzenie powiadomienia
      const postRef = doc(db, "posts", postId);
      const postSnapshot = await getDoc(postRef);

      if (postSnapshot.exists()) {
        const postData = postSnapshot.data();

        const notificationRef = collection(
          db,
          "notifications",
          postData.userId,
          "userNotifications"
        );

        await addDoc(notificationRef, {
          message: `${authorName} dodał komentarz do Twojego posta`,
          postId, // Dodanie ID posta
          type: "comment",
          date: serverTimestamp(),
          read: false,
        });
      }

      setNewComment((prev) => ({ ...prev, [postId]: "" })); // Czyszczenie pola komentarza
      fetchPosts(); // Odświeżenie postów po dodaniu komentarza
    } catch (error) {
      console.error("Błąd podczas dodawania komentarza:", error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!user) return; // Sprawdź, czy użytkownik jest zalogowany

    const commentRef = doc(db, "posts", postId, "comments", commentId);

    try {
      await deleteDoc(commentRef); // Usuń dokument komentarza
      alert("Komentarz został usunięty");
      fetchPosts(); // Odśwież posty po usunięciu komentarza
    } catch (error) {
      console.error("Błąd podczas usuwania komentarza:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <HomePageHeader />
      <div className="flex flex-1 justify-center items-start pt-16">
        <main className="w-5/6 p-4">
          {user && (
            <div className="w-full flex flex-col items-center mb-4">
              <FilterPosts posts={posts} setFilteredPosts={setFilteredPosts} />
              <PostForm
                user={user}
                profilePicture={profilePicture}
                handleSubmitPost={handleSubmitPost}
              />
            </div>
          )}
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const { name, profilePicture } = getAuthorInfo(post.userId);
              return (
                <div id={post.id} key={post.id}>
                  <PostItem
                    post={post}
                    user={user}
                    authorName={name}
                    authorProfilePicture={profilePicture}
                    handleLike={handleLike}
                    handleCommentChange={handleCommentChange}
                    newComment={newComment}
                    handleAddComment={handleAddComment}
                    handleDeleteComment={handleDeleteComment} // Dodano przekazanie handleDeleteComment
                    currentUserId={user?.uid}
                    handleDeletePost={handleDeletePost}
                    handleEditPost={handleEditPost}
                  />
                </div>
              );
            })}
          </div>
        </main>
      </div>
      <ChatPanel /> {/* Wstawienie panelu czatu */}
      <ScrollToTopButton />
    </div>
  );
};

export default HomePage;
