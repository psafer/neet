import { useState } from "react";
import PropTypes from "prop-types";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const SearchBar = ({ onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState(""); // Stan przechowujący aktualny wpis w polu wyszukiwania
  const [searchResults, setSearchResults] = useState([]); // Lista wyników wyszukiwania

  // Funkcja odpowiedzialna za pobieranie wyników wyszukiwania z Firestore
  const fetchSearchResults = async (searchTerm) => {
    if (searchTerm.length > 1) {
      const usersRef = collection(db, "profiles"); // Referencja do kolekcji `profiles`
      const q = query(usersRef, orderBy("firstName")); // Sortowanie wyników po imieniu
      const querySnapshot = await getDocs(q);

      // Filtrowanie wyników wyszukiwania na podstawie imienia i nazwiska
      const filteredResults = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() })) // Mapowanie wyników do obiektów
        .filter((user) => {
          const fullName = `${user.firstName.toLowerCase()} ${user.lastName.toLowerCase()}`;
          return fullName.includes(searchTerm.toLowerCase());
        });

      setSearchResults(filteredResults); // Aktualizacja stanu wyników wyszukiwania
    } else {
      setSearchResults([]); // Czyszczenie wyników, jeśli wyszukiwanie jest zbyt krótkie
    }
  };

  // Obsługa zmiany w polu wyszukiwania
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setSearchQuery(searchTerm); // Aktualizacja wpisanej frazy
    fetchSearchResults(searchTerm); // Wywołanie funkcji wyszukiwania
  };

  return (
    <div className="relative w-full md:w-64">
      {/* Pole tekstowe do wyszukiwania użytkowników */}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Znajdź użytkownika..."
        className="bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none w-full"
      />
      {/* Lista wyników wyszukiwania */}
      <ul className="absolute bg-gray-800 text-white w-full max-h-60 overflow-y-auto rounded-lg shadow-lg z-50 mt-2">
        {/* Wyświetlanie komunikatu, jeśli nie znaleziono użytkowników */}
        {searchResults.length === 0 && searchQuery.length > 1 ? (
          <li className="p-2 text-gray-400">Nie znaleziono użytkownika</li>
        ) : (
          // Wyświetlanie wyników wyszukiwania
          searchResults.map((result) => (
            <li
              key={result.id} // Klucz identyfikujący użytkownika
              onClick={() => onUserSelect(result.id)} // Funkcja wywoływana po kliknięciu na użytkownika
              className="cursor-pointer hover:bg-gray-700 p-2 flex items-center"
            >
              {/* Zdjęcie profilowe użytkownika */}
              <img
                src={result.profilePicture || "/mini.png"}
                alt={`${result.firstName} ${result.lastName}`}
                className="w-8 h-8 rounded-full mr-2"
              />
              {/* Imię i nazwisko użytkownika */}
              {result.firstName} {result.lastName}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

SearchBar.propTypes = {
  onUserSelect: PropTypes.func.isRequired, // Funkcja wywoływana po wybraniu użytkownika
};

export default SearchBar;
