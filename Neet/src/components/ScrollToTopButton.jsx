import { useState, useEffect } from "react";
import { ArrowUpIcon } from "@heroicons/react/24/outline"; // Heroicons v2

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Funkcja do przewinięcia na górę
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Płynne przewijanie
    });
  };

  // Monitorowanie pozycji przewinięcia
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    // Czyszczenie zdarzenia przy odmontowaniu
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <div>
      {isVisible && (
        <div
          onClick={scrollToTop}
          className="fixed top-20 left-60 bg-transparent cursor-pointer hover:scale-110 transition-transform duration-300 ease-in-out group"
        >
          {/* Strzałka z grubszym konturem i animacją "bounce" */}
          <ArrowUpIcon className="w-10 h-10 text-orange-500 animate-bounce stroke-[2]" />

          {/* Napis "w górę" pojawia się po najechaniu na strzałkę */}
          <span className="block mt-2 text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            w górę
          </span>
        </div>
      )}
    </div>
  );
};

export default ScrollToTopButton;
