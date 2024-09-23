import { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/UseAuth';
import { useNavigate } from 'react-router-dom';

const CreateProfilePage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCreateProfile = async (e) => {
    e.preventDefault();

    try {
      await setDoc(doc(db, 'profiles', currentUser.uid), {
        firstName,
        lastName,
        gender,
        bio,
      });

      navigate('/'); // Navigate to home after profile creation
    } catch (error) {
      console.error('Błąd podczas tworzenia profilu:', error);
      alert('Wystąpił błąd podczas tworzenia profilu.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <img src="/logo.png" alt="Logo" className="w-32 h-32 mb-3" />

      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-orange-500 mb-6">
          Utwórz Profil
        </h1>

        <form onSubmit={handleCreateProfile}>
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
              onChange={(e) => setFirstName(e.target.value)}
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
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              className="shadow appearance-none border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-orange-500"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
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
              onChange={(e) => setBio(e.target.value)}
              rows="4"
              required
            />
          </div>

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
