import { useState } from "react";
import PropTypes from "prop-types";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const SearchBar = ({ onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const fetchSearchResults = async (searchTerm) => {
    if (searchTerm.length > 1) {
      const usersRef = collection(db, "profiles");
      const q = query(usersRef, orderBy("firstName"));
      const querySnapshot = await getDocs(q);

      const filteredResults = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => {
          const fullName = `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`;
          return fullName.includes(searchTerm.toLowerCase());
        });

      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchQuery(searchTerm);
    fetchSearchResults(searchTerm);
  };

  return (
    <div className="relative w-full md:w-64">
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Znajdź użytkownika..."
        className="bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none w-full"
      />
      <ul className="absolute bg-gray-800 text-white w-full max-h-60 overflow-y-auto rounded-lg shadow-lg z-50 mt-2">
        {searchResults.length === 0 && searchQuery.length > 1 ? (
          <li className="p-2 text-gray-400">Nie znaleziono użytkownika</li>
        ) : (
          searchResults.map((result) => (
            <li
              key={result.id}
              onClick={() => onUserSelect(result.id)}
              className="cursor-pointer hover:bg-gray-700 p-2 flex items-center"
            >
              <img
                src={result.profilePicture || "/mini.png"}
                alt={`${result.firstName} ${result.lastName}`}
                className="w-8 h-8 rounded-full mr-2"
              />
              {result.firstName} {result.lastName}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

SearchBar.propTypes = {
  onUserSelect: PropTypes.func.isRequired,
};

export default SearchBar;
