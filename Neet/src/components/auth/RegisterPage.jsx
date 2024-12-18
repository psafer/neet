import { useState } from "react";
import { auth, db } from "../../config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

const RegisterPage = () => {
  const [email, setEmail] = useState(""); // Przechowywanie adresu e-mail
  const [password, setPassword] = useState(""); // Przechowywanie hasła
  const [confirmPassword, setConfirmPassword] = useState(""); // Przechowywanie potwierdzenia hasła
  const [error, setError] = useState(null); // Przechowywanie komunikatów błędów
  const navigate = useNavigate(); // Nawigacja po zakończonej rejestracji

  // Walidacja adresu e-mail
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Wyrażenie regularne do walidacji e-maila
    return emailRegex.test(email);
  };

  // Walidacja hasła
  const isValidPassword = (password) => {
    return (
      password.length >= 8 && // Minimalna długość hasła
      /[A-Z]/.test(password) && // Co najmniej jedna wielka litera
      /[a-z]/.test(password) && // Co najmniej jedna mała litera
      /[0-9]/.test(password) && // Co najmniej jedna cyfra
      /[\W_]/.test(password) // Co najmniej jeden znak specjalny
    );
  };

  // Obsługa rejestracji użytkownika
  const handleRegister = async (e) => {
    e.preventDefault();

    // Walidacja adresu e-mail
    if (!isValidEmail(email)) {
      setError("Wprowadź poprawny adres e-mail.");
      return;
    }

    // Walidacja hasła
    if (!isValidPassword(password)) {
      setError(
        "Hasło musi zawierać co najmniej 8 znaków, w tym wielką literę, małą literę, cyfrę i znak specjalny."
      );
      return;
    }

    // Sprawdzenie, czy hasła są identyczne
    if (password !== confirmPassword) {
      setError("Hasła muszą być takie same!");
      return;
    }

    try {
      // Rejestracja użytkownika za pomocą e-maila i hasła
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Tworzenie profilu użytkownika w Firestore z adresem e-mail
      await setDoc(doc(db, "profiles", user.uid), {
        email: user.email, // Przekazanie adresu e-mail
        firstName: "", // Placeholder na imię (uzupełniane później w CreateProfilePage)
        lastName: "", // Placeholder na nazwisko
        profilePicture:
          "https://firebasestorage.googleapis.com/v0/b/neet-f16e6.appspot.com/o/assets%2Fmini.png?alt=media&token=ae661abb-b923-45c9-ae56-a7dde20ba308", // Domyślne zdjęcie profilowe
      });

      navigate("/createProfilePage"); // Przekierowanie na stronę tworzenia profilu
    } catch (error) {
      console.error("Błąd rejestracji:", error);
      setError(error.message); // Wyświetlenie komunikatu o błędzie
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      {/* Logo aplikacji */}
      <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-3" />

      {/* Formularz rejestracji */}
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Rejestracja
        </h1>

        {/* Wyświetlenie komunikatu błędu, jeśli istnieje */}
        {error && (
          <div className="text-red-500 bg-red-100 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Adres e-mail:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Aktualizacja adresu e-mail
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Hasło:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // Aktualizacja hasła
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-orange-500 text-sm font-bold mb-2"
            >
              Potwierdź hasło:
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} // Aktualizacja potwierdzenia hasła
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Zarejestruj się
            </button>
          </div>
        </form>

        {/* Link do strony logowania */}
        <p className="mt-4 text-center text-gray-400">
          Masz konto?{" "}
          <Link to="/login" className="text-orange-500 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
