import PropTypes from "prop-types";
import { HomeIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, auth } from "../../config/firebaseConfig";

const FilterPosts = ({ posts, setFilteredPosts }) => {
  const [filter, setFilter] = useState("all"); // Stan filtra: "all" lub "friends"
  const [followingList, setFollowingList] = useState([]); // Lista obserwowanych użytkowników

  // Pobierz listę znajomych (obserwowanych)
  useEffect(() => {
    const fetchFollowingList = async () => {
      const currentUser = auth.currentUser; // Sprawdź zalogowanego użytkownika
      if (currentUser) {
        try {
          const followersRef = collection(db, "followers");
          const q = query(
            followersRef,
            where("followerId", "==", currentUser.uid) // Pobierz znajomych użytkownika
          );
          const snapshot = await getDocs(q);
          const following = snapshot.docs.map((doc) => doc.data().followingId); // Wyciągnij ID znajomych
          setFollowingList(following); // Zaktualizuj stan
        } catch (error) {
          console.error("Błąd podczas pobierania listy znajomych:", error);
        }
      }
    };

    fetchFollowingList();
  }, []); // Wywołaj tylko raz, gdy komponent się zamontuje

  // Aktualizuj filtrowane posty na podstawie wybranego filtra
  useEffect(() => {
    if (filter === "all") {
      // Jeśli filtr to "all", pokaż wszystkie posty
      setFilteredPosts(posts);
    } else if (filter === "friends") {
      // Jeśli filtr to "friends", pokaż tylko posty znajomych
      const filtered = posts.filter((post) =>
        followingList.includes(post.userId)
      );
      setFilteredPosts(filtered);
    }
  }, [filter, posts, followingList, setFilteredPosts]); // Aktualizuj za każdym razem, gdy zmieni się filtr, posty lub lista znajomych

  return (
    <div className="w-full max-w-3xl flex justify-center mb-4">
      {/* Przycisk "Wszystkie posty" */}
      <button
        onClick={() => setFilter("all")}
        className={`px-4 py-2 w-1/2 flex justify-center items-center ${
          filter === "all"
            ? "bg-orange-500 text-white" // Styl aktywnego przycisku
            : "bg-gray-600 text-gray-200"
        } rounded-l-lg focus:outline-none`}
      >
        <HomeIcon className="h-5 w-5 mr-1" />
        Wszystkie
      </button>

      {/* Przycisk "Posty znajomych" */}
      <button
        onClick={() => setFilter("friends")}
        className={`px-4 py-2 w-1/2 flex justify-center items-center ${
          filter === "friends"
            ? "bg-orange-500 text-white" // Styl aktywnego przycisku
            : "bg-gray-600 text-gray-200"
        } rounded-r-lg focus:outline-none`}
      >
        <UserGroupIcon className="h-5 w-5 mr-1" />
        Znajomi
      </button>
    </div>
  );
};

FilterPosts.propTypes = {
  posts: PropTypes.array.isRequired, // Tablica postów
  setFilteredPosts: PropTypes.func.isRequired, // Funkcja do ustawienia filtrowanych postów
};

export default FilterPosts;
