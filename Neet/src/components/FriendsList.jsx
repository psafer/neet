import { useState, useEffect, useRef } from "react";

const FriendsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState([
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Chris Johnson" },
  ]); // Przykładowa lista znajomych
  const [isOpen, setIsOpen] = useState(false); // Kontrola widoczności listy
  const listRef = useRef(null); // Referencja do listy znajomych

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funkcja otwierania/zamykania listy znajomych
  const toggleFriendsList = () => {
    setIsOpen((prev) => !prev);
  };

  // Zamknij listę, jeśli kliknięto poza nią
  const handleClickOutside = (event) => {
    if (listRef.current && !listRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Ikona do otwierania/zamykania listy znajomych */}
      <i
        className="fa-solid fa-users text-white cursor-pointer"
        onClick={toggleFriendsList}
      ></i>

      {/* Lista znajomych */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute right-0 mt-2 w-64 bg-gray-800 shadow-lg rounded-lg p-4 text-white z-50"
        >
          <input
            type="text"
            placeholder="Wyszukaj znajomego..."
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <div key={friend.id} className="border-b border-gray-600 py-2">
                <p>{friend.name}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Brak wyników</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendsList;
