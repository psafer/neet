import { useState, useEffect } from "react";
import { auth, db, storage } from "../../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import EditProfileSettings from "./EditProfileSettings";
import DeleteProfile from "./DeleteProfile";

const ProfileSettings = () => {
  // Stany do przechowywania danych użytkownika i profilu
  const [user, setUser] = useState(null); // Przechowuje zalogowanego użytkownika
  const [profileData, setProfileData] = useState(null); // Dane profilu użytkownika
  const [editing, setEditing] = useState(false); // Flaga do trybu edycji profilu
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    profilePicture: "",
  }); // Stan formularza edycji profilu
  const [file, setFile] = useState(null); // Plik obrazu do aktualizacji zdjęcia profilowego

  const navigate = useNavigate(); // Hook do nawigacji pomiędzy stronami

  // Efekt do pobierania danych zalogowanego użytkownika i profilu
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user); // Ustaw dane użytkownika
        const docRef = doc(db, "profiles", user.uid); // Referencja do dokumentu profilu
        const docSnap = await getDoc(docRef); // Pobierz dane profilu z Firestore
        if (docSnap.exists()) {
          setProfileData(docSnap.data()); // Ustaw dane profilu
          setFormData(docSnap.data()); // Ustaw dane formularza
        }
      }
    });
    return () => unsubscribe(); // Czyszczenie nasłuchiwania
  }, []);

  // Obsługa zmiany wartości w formularzu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Obsługa zmiany pliku zdjęcia profilowego
  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Ustaw plik do przesłania
  };

  // Funkcja do przesyłania nowego zdjęcia profilowego do Firebase Storage
  const uploadProfilePicture = async () => {
    if (!file) return null; // Jeśli brak pliku, zwróć null
    const storageRef = ref(storage, `profilePictures/${user.uid}`); // Ścieżka do przechowywania pliku
    await uploadBytes(storageRef, file); // Przesyłanie pliku
    return getDownloadURL(storageRef); // Pobierz URL przesłanego pliku
  };

  // Funkcja obsługująca zapisanie zmian w profilu
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let profilePictureURL = formData.profilePicture;
      if (file) profilePictureURL = await uploadProfilePicture(); // Aktualizacja zdjęcia, jeśli plik istnieje

      // Aktualizacja danych profilu w Firestore
      await updateDoc(doc(db, "profiles", user.uid), {
        ...formData,
        profilePicture: profilePictureURL,
      });

      setEditing(false); // Wyłącz tryb edycji
      window.location.reload(); // Odśwież stronę, aby zaktualizować dane
    } catch (error) {
      console.error("Błąd podczas aktualizacji profilu:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
      {/* Logo z odnośnikiem do strony głównej */}
      <img
        src="/mini.png"
        alt="Logo"
        className="w-31 h-32 mb-3 cursor-pointer"
        onClick={() => navigate("/")} // Przeniesienie na stronę główną
      />
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Nagłówek sekcji profilu */}
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Profil
        </h1>
        {user ? (
          <div className="text-center">
            {editing ? (
              // Renderowanie formularza edycji profilu
              <EditProfileSettings
                formData={formData}
                handleChange={handleChange}
                handleFileChange={handleFileChange}
                handleSave={handleSave}
                setEditing={setEditing}
              />
            ) : (
              // Wyświetlanie danych profilu
              <>
                {profileData?.profilePicture && (
                  <img
                    src={profileData.profilePicture}
                    alt="Zdjęcie profilowe"
                    className="w-32 h-32 mb-4 rounded-full mx-auto"
                  />
                )}
                {/* Wyświetlanie imienia, nazwiska i opisu */}
                <p className="text-gray-400 text-2xl font-bold mb-1">
                  {profileData?.firstName} {profileData?.lastName}
                </p>
                <p className="text-gray-400 mb-2">{profileData?.bio}</p>

                {/* Sekcja z przyciskami */}
                <div className="flex flex-col items-center space-y-4 mt-3">
                  {/* Przycisk edycji profilu */}
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded mt-1"
                  >
                    Edytuj profil
                  </button>

                  {/* Przycisk usuwania konta */}
                  <DeleteProfile userId={user.uid} />
                </div>
              </>
            )}
          </div>
        ) : (
          // Informacja o konieczności zalogowania
          <p className="text-gray-400">
            Musisz być zalogowany, aby zobaczyć swój profil.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
