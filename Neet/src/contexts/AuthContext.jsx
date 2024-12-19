import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { auth } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";

// Tworzenie kontekstu autoryzacji i eksportowanie go
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = React.createContext();

/**
 * Komponent dostarczający kontekst autoryzacji dla całej aplikacji.
 */
export function AuthProvider({ children }) {
  // Stan do przechowywania aktualnego użytkownika
  const [currentUser, setCurrentUser] = useState(null);

  // Stan do śledzenia procesu ładowania (inicjalizacji autoryzacji)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDatabase();

    /**
     * Funkcja aktualizująca status użytkownika na "available".
     * Ustawia także "offline" w przypadku disconnectu.
     */
    const updateStatus = async (user) => {
      if (user) {
        const userStatusRef = ref(db, `status/${user.uid}`);

        const onlineState = {
          state: "available",
          last_changed: serverTimestamp(),
        };

        const offlineState = {
          state: "offline",
          last_changed: serverTimestamp(),
        };

        // Ustaw "offline" przy disconnect
        await onDisconnect(userStatusRef).set(offlineState);

        // Ustaw status na "available"
        await set(userStatusRef, onlineState);
      }
    };

    // Funkcja nasłuchująca zmiany stanu autoryzacji
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user); // Aktualizacja stanu bieżącego użytkownika
        if (user) {
          updateStatus(user); // Ustaw status użytkownika jako "available"
        }
        setLoading(false); // Zakończenie ładowania po określeniu stanu
      },
      (error) => {
        console.error("Błąd przy zmianie stanu autoryzacji:", error);
        setLoading(false); // Zakończenie ładowania nawet w przypadku błędu
      }
    );

    // Zwracana funkcja wyczyści nasłuchiwanie przy odmontowaniu komponentu
    return () => unsubscribe();
  }, []);

  // Wartość, która będzie udostępniana innym komponentom w aplikacji
  const value = {
    currentUser, // Aktualny użytkownik (null, jeśli brak zalogowanego użytkownika)
  };

  return (
    // Udostępnienie kontekstu dla dzieci komponentu
    <AuthContext.Provider value={value}>
      {!loading && children}{" "}
      {/* Renderowanie dzieci tylko, jeśli zakończono ładowanie */}
    </AuthContext.Provider>
  );
}

// Walidacja typu dla prop 'children' za pomocą PropTypes
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired, // Dzieci muszą być węzłem React
};
