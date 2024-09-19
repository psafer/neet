import { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    bio: '',
    profilePicture: '', // Pole na URL zdjęcia profilowego
  });
  const [file, setFile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        try {
          const docRef = doc(db, 'profiles', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setProfileData(docSnap.data());
            setFormData(docSnap.data());
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Błąd podczas pobierania danych profilu:', error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadProfilePicture = async () => {
    if (!file) return null;

    const storageRef = ref(storage, `profilePictures/${user.uid}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      let profilePictureURL = formData.profilePicture;

      if (file) {
        profilePictureURL = await uploadProfilePicture();
      }

      await updateDoc(doc(db, 'profiles', user.uid), {
        ...formData,
        profilePicture: profilePictureURL,
      });

      setEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Logo that links to the homepage */}
      <img
        src="/logo.png"
        alt="Logo"
        className="w-32 h-32 mb-3 cursor-pointer"
        onClick={() => navigate('/')}
      />

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8 mx-auto">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Profil
        </h1>

        {user ? (
          <div className="flex flex-col items-center">
            {editing ? (
              <form onSubmit={handleSave} className="w-full">
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
                    name="firstName"
                    className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

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
                    name="lastName"
                    className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="gender"
                    className="block text-orange-500 text-sm font-bold mb-2"
                  >
                    Płeć:
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
                    value={formData.gender}
                    onChange={handleChange}
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

                <div className="mb-4">
                  <label
                    htmlFor="bio"
                    className="block text-orange-500 text-sm font-bold mb-2"
                  >
                    Opis:
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    required
                  />
                </div>

                {/* File input for profile picture */}
                <div className="mb-6">
                  <label
                    htmlFor="profilePicture"
                    className="block text-orange-500 text-sm font-bold mb-2"
                  >
                    Zdjęcie profilowe:
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    onChange={handleFileChange}
                    className="text-gray-200"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Zapisz
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            ) : (
              // Profile data display
              <div className="text-center">
                {profileData?.profilePicture ? (
                  <img
                    src={profileData.profilePicture}
                    alt="Zdjęcie profilowe"
                    className="w-32 h-32 mb-4 rounded-full mx-auto"
                  />
                ) : (
                  <p className="text-gray-400 mb-4">Brak zdjęcia profilowego</p>
                )}
                <p className="text-gray-400 mb-2">Imię: {profileData?.firstName}</p>
                <p className="text-gray-400 mb-2">Nazwisko: {profileData?.lastName}</p>
                <p className="text-gray-400 mb-2">Płeć: {profileData?.gender}</p>
                <p className="text-gray-400 mb-2">Opis: {profileData?.bio}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
                >
                  Edytuj profil
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400">Musisz być zalogowany, aby zobaczyć swój profil.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
