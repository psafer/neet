import { useState } from "react";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Hasła muszą być takie same!");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/createProfilePage"); // Przekierowanie na stronę tworzenia profilu po rejestracji
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      {/* Logo */}
      <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-3" />

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Rejestracja
        </h1>

        {/* Error message */}
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
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
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
