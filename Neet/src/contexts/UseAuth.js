import { useContext } from 'react';
import { AuthContext } from './AuthContext'; // Import the AuthContext

export function useAuth() {
  return useContext(AuthContext);
}
