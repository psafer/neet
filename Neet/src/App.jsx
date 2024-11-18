import { AuthProvider } from "./contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./components/home/HomePage";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import CreateProfilePage from "./components/profile/CreateProfilePage";
import ProfilePage from "./components/profile/ProfilePage";
import UserProfile from "./components/profile/UserProfile";
import { auth } from "./firebaseConfig"; // Import Firebase auth
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={user ? <HomePage /> : <Navigate to="/login" replace />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/createProfilePage" element={<CreateProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
