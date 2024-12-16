import { useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/UseAuth"; // Pobranie kontekstu autoryzacji
import { useNavigate } from "react-router-dom";

const CreateProfilePage = () => {
  // Stany do przechowywania danych wprowadzonych w formularzu
  const [firstName, setFirstName] = useState(""); // Imię
  const [lastName, setLastName] = useState(""); // Nazwisko
  const [gender, setGender] = useState(""); // Płeć
  const [bio, setBio] = useState(""); // Bio użytkownika
  const { currentUser } = useAuth(); // Aktualnie zalogowany użytkownik z kontekstu
  const navigate = useNavigate(); // Hook do nawigacji

  // Funkcja obsługująca tworzenie profilu
  const handleCreateProfile = async (e) => {
    e.preventDefault(); // Zapobiega przeładowaniu strony po wysłaniu formularza

    try {
      // Dodanie danych profilu do Firestore
      await setDoc(doc(db, "profiles", currentUser.uid), {
        firstName,
        lastName,
        gender,
        bio,
      });

      // Przekierowanie na stronę główną po pomyślnym utworzeniu profilu
      navigate("/");
    } catch (error) {
      console.error("Błąd podczas tworzenia profilu:", error); // Logowanie błędu do konsoli
      alert("Wystąpił błąd podczas tworzenia profilu."); // Wyświetlenie komunikatu o błędzie
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      {/* Logo */}
      <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-3" />

      {/* Formularz tworzenia profilu */}
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Utwórz Profil
        </h1>

        <form onSubmit={handleCreateProfile}>
          {/* Pole tekstowe dla imienia */}
          <div className="mb-4">
            <label
              htmlFor="firstName"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Imię:
            </label>
            <input
              type="text"
              id="firstName"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)} // Aktualizacja stanu `firstName`
              required
            />
          </div>

          {/* Pole tekstowe dla nazwiska */}
          <div className="mb-4">
            <label
              htmlFor="lastName"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Nazwisko:
            </label>
            <input
              type="text"
              id="lastName"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)} // Aktualizacja stanu `lastName`
              required
            />
          </div>

          {/* Select dla płci */}
          <div className="mb-4">
            <label
              htmlFor="gender"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Płeć:
            </label>
            <select
              id="gender"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)} // Aktualizacja stanu `gender`
              required
            >
              <option value="" disabled>
                Wybierz płeć
              </option>
              <option value="male">Mężczyzna</option>
              <option value="female">Kobieta</option>
              <option value="other">Inna</option>
            </select>
          </div>

          {/* Pole tekstowe dla bio */}
          <div className="mb-6">
            <label
              htmlFor="bio"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Bio:
            </label>
            <textarea
              id="bio"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={bio}
              onChange={(e) => setBio(e.target.value)} // Aktualizacja stanu `bio`
              rows="4"
              required
            />
          </div>

          {/* Przycisk przesyłania formularza */}
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Utwórz profil
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProfilePage;
