import PropTypes from "prop-types";
import { HomeIcon, UserGroupIcon } from "@heroicons/react/24/solid";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";

const FilterPosts = ({ posts, setFilteredPosts }) => {
  const [filter, setFilter] = useState("all");
  const [followingList, setFollowingList] = useState([]);

  // Pobierz listę znajomych (obserwowanych)
  useEffect(() => {
    const fetchFollowingList = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const followersRef = collection(db, "followers");
        const q = query(
          followersRef,
          where("followerId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const following = snapshot.docs.map((doc) => doc.data().followingId);
        setFollowingList(following);
      }
    };
    fetchFollowingList();
  }, []);

  // Aktualizuj filtrowane posty na podstawie filtru
  useEffect(() => {
    if (filter === "all") {
      setFilteredPosts(posts);
    } else if (filter === "friends") {
      const filtered = posts.filter((post) =>
        followingList.includes(post.userId)
      );
      setFilteredPosts(filtered);
    }
  }, [filter, posts, followingList, setFilteredPosts]);

  return (
    <div className="w-full max-w-3xl flex justify-center mb-4">
      <button
        onClick={() => setFilter("all")}
        className={`px-4 py-2 w-1/2 flex justify-center items-center ${
          filter === "all"
            ? "bg-orange-500 text-white"
            : "bg-gray-600 text-gray-200"
        } rounded-l-lg focus:outline-none`}
      >
        <HomeIcon className="h-5 w-5 mr-1" />
      </button>
      <button
        onClick={() => setFilter("friends")}
        className={`px-4 py-2 w-1/2 flex justify-center items-center ${
          filter === "friends"
            ? "bg-orange-500 text-white"
            : "bg-gray-600 text-gray-200"
        } rounded-r-lg focus:outline-none`}
      >
        <UserGroupIcon className="h-5 w-5 mr-1" />
      </button>
    </div>
  );
};

FilterPosts.propTypes = {
  posts: PropTypes.array.isRequired,
  setFilteredPosts: PropTypes.func.isRequired,
};

export default FilterPosts;
