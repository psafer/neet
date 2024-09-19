import { AuthProvider } from './contexts/AuthContext';
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import CreateProfilePage from "./components/CreateProfilePage";
import ProfilePage from './components/ProfilePage';
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
        <Route path="/createProfilePage" element={<CreateProfilePage/>}/>
        <Route path='/profile' element={<ProfilePage/>}/>
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
