import { useState, useEffect } from "react";

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
        <button
          onClick={scrollToTop}
          className="fixed top-20 left-80 bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-orange-500 hover:scale-110 focus:outline-none transition duration-300 ease-in-out scroll-bounce"
          style={{ fontSize: "24px" }}
        >
          &#8679;
        </button>
      )}
    </div>
  );
};

export default ScrollToTopButton;
