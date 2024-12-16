import { AuthProvider } from "./src/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./src/components/home/HomePage";
import LoginPage from "./src/components/auth/LoginPage";
import RegisterPage from "./src/components/auth/RegisterPage";
import CreateProfilePage from "./src/components/profile/CreateProfilePage";
import ProfileSettings from "./src/components/profile/ProfileSettings";
import UserProfile from "./src/components/profile/UserProfile";
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
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
