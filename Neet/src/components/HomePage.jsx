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
  deleteDoc, // Import do usuwania posta
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import HomePageHeader from "./HomePageHeader";
import PostForm from "./PostForm";
import PostItem from "./PostItem";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchPosts();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Pobieranie danych profilu użytkownika
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfilePicture(profileData.profilePicture);
        }

        // Nasłuchiwanie powiadomień
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

  const handleSubmitPost = async (content, imageUrl) => {
    if (!user) return;

    try {
      const docRef = doc(db, "profiles", user.uid);
      const docSnap = await getDoc(docRef);
      let authorName = "Anonim";
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        authorName = `${profileData.firstName} ${profileData.lastName}`;
      }

      // Dodawanie nowego posta
      await addDoc(collection(db, "posts"), {
        content,
        imageUrl: imageUrl || null,
        author: authorName,
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

  // Funkcja do usuwania posta
  const handleDeletePost = async (postId) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      fetchPosts(); // Odswieżenie postów po usunięciu
      alert("Post został usunięty");
    } catch (error) {
      console.error("Błąd podczas usuwania posta:", error);
    }
  };

  // Funkcja do edytowania posta
  const handleEditPost = (postId) => {
    alert(`Edytuj post o ID: ${postId}`);
    // Tutaj możesz przekierować użytkownika na stronę edycji lub otworzyć formularz edycji
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

        // Powiadomienie dla autora posta
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

      // Powiadomienie dla autora posta
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
            <PostForm
              user={user}
              profilePicture={profilePicture}
              handleSubmitPost={handleSubmitPost}
            />
          )}
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                user={user}
                handleLike={handleLike}
                handleCommentChange={handleCommentChange}
                newComment={newComment}
                handleAddComment={handleAddComment}
                handleDeletePost={handleDeletePost} // Przekazujemy do PostItem
                handleEditPost={handleEditPost} // Przekazujemy do PostItem
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
