import { useState, useEffect } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/outline"; // Heroicons v2

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false); // Stan widoczności przycisku

  // Funkcja przewijająca stronę na górę
  const scrollToTop = () => {
    window.scrollTo({
      top: 0, // Przewiń na samą górę
      behavior: "smooth", // Płynne przewijanie
    });
  };

  // Monitorowanie pozycji przewinięcia okna
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true); // Pokaż przycisk, jeśli przewinięcie > 300px
      } else {
        setIsVisible(false); // Ukryj przycisk, jeśli przewinięcie <= 300px
      }
    };

    window.addEventListener("scroll", toggleVisibility); // Nasłuchuj zdarzenia przewijania

    // Czyszczenie zdarzenia przy odmontowaniu komponentu
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div>
      {isVisible && ( // Renderuj przycisk tylko, gdy jest widoczny
        <div
          onClick={scrollToTop} // Akcja przewinięcia na górę
          className="fixed top-20 left-60 bg-transparent cursor-pointer hover:scale-110 transition-transform duration-300 ease-in-out group"
        >
          {/* Ikona strzałki - animacja "bounce" */}
          <ArrowUpIcon className="w-10 h-10 text-orange-500 animate-bounce stroke-[2]" />

          {/* Tekst pojawiający się po najechaniu na strzałkę */}
          <span className="block mt-2 text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            w górę
          </span>
        </div>
      )}
    </div>
  );
};

export default ScrollToTopButton;
