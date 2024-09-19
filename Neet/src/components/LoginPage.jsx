import { useState } from "react";
import { auth, db } from "../firebaseConfig"; // Pamiętaj o imporcie db dla Firestore
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Dodaj te importy dla Firestore

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Redirect to home page after login
    } catch (error) {
      console.error("Error logging in:", error);
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Sprawdź, czy użytkownik ma już profil w Firestore
      const userDocRef = doc(db, 'profiles', user.uid);
      const userDoc = await getDoc(userDocRef);
  
      // Jeśli profil nie istnieje, zapisz dane użytkownika, w tym zdjęcie z Google
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          firstName: user.displayName.split(' ')[0], // Imię
          lastName: user.displayName.split(' ')[1] || '', // Nazwisko
          email: user.email, // E-mail
          profilePicture: user.photoURL, // Zdjęcie profilowe z Google
          bio: "Użytkownik Google" // Domyślne bio
        });
      }
  
      // Przekieruj użytkownika po zalogowaniu
      navigate('/');
    } catch (error) {
      console.error('Error logging in with Google:', error);
      alert(error.message);
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Logo */}
      <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-3" />

      {/* Login Form */}
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Logowanie
        </h1>

        <form onSubmit={handleLogin}>
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
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
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
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Zaloguj się
            </button>
          </div>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center bg-orange-700 hover:bg-orange-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full mt-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-6 h-6 mr-2"
          >
            <path
              fill="#4285F4"
              d="M24 9.5c3.84 0 6.35 1.66 7.8 3.04l5.74-5.74C33.7 3.67 29.28 2 24 2 14.83 2 7.35 8.48 4.77 16.96l6.75 5.26C13.36 15.73 18.16 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.57 24.5c0-1.56-.14-3.11-.41-4.6H24v9.08h12.7c-.55 2.86-2.16 5.27-4.6 6.93l7.27 5.66C44.75 37.15 46.57 31.25 46.57 24.5z"
            />
            <path
              fill="#FBBC05"
              d="M11.52 29.92c-1.35-.81-2.56-1.83-3.53-3.04l-6.75 5.26C4.56 37.74 8.94 41.21 14 42.6l5.3-7.04c-2.89-.79-5.33-2.5-7.05-4.64z"
            />
            <path
              fill="#EA4335"
              d="M24 46c5.52 0 10.15-1.83 13.53-4.95l-7.27-5.66c-2.05 1.33-4.7 2.13-7.26 2.13-5.82 0-10.75-3.94-12.53-9.32l-6.75 5.26C7.35 39.52 14.83 46 24 46z"
            />
          </svg>
          <span>Zaloguj się przez Google</span>
        </button>

        <p className="mt-4 text-center text-gray-400">
          Nie masz konta?{" "}
          <Link to="/register" className="text-orange-500 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
