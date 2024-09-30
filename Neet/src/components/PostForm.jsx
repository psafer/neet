import { useRef, useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import PropTypes from "prop-types"; // Import PropTypes
import { storage } from "../firebaseConfig";

const PostForm = ({ handleSubmitPost }) => {
  const [newPost, setNewPost] = useState({ content: "", images: [], imagePreviews: [] });
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Stan do kontroli rozwijania formularza
  const inputFileRef = useRef(null);
  const formRef = useRef(null); // Referencja do formularza
  const emojiPickerRef = useRef(null); // Referencja do Emoji Picker

  // Nasłuchiwanie kliknięć poza formularzem
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setIsFormOpen(false); // Zamknij formularz
      }

      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false); // Zamknij Emoji Picker
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setNewPost((prevPost) => ({
      ...prevPost,
      content: prevPost.content + emoji,
    }));
  };

  // Obsługa zmiany zdjęć
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePreviews = files.map((file) => URL.createObjectURL(file));

    setNewPost((prevPost) => ({
      ...prevPost,
      images: [...prevPost.images, ...files],
      imagePreviews: [...prevPost.imagePreviews, ...imagePreviews],
    }));
  };

  // Usuwanie zdjęcia z podglądu
  const handleRemoveImage = (index) => {
    setNewPost((prevPost) => {
      const updatedImages = [...prevPost.images];
      const updatedPreviews = [...prevPost.imagePreviews];

      updatedImages.splice(index, 1); // Usuwamy obraz
      updatedPreviews.splice(index, 1); // Usuwamy podgląd

      return {
        ...prevPost,
        images: updatedImages,
        imagePreviews: updatedPreviews,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    // Uploadowanie każdego obrazu
    const uploadedImageUrls = await Promise.all(
      newPost.images.map(async (image) => {
        const storageRef = ref(storage, `posts/${image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, image);
        const snapshot = await uploadTask;
        return await getDownloadURL(snapshot.ref);
      })
    );

    handleSubmitPost(newPost.content, uploadedImageUrls);
    setUploading(false);
    setNewPost({ content: "", images: [], imagePreviews: [] });
    setIsFormOpen(false); // Zamknij formularz po dodaniu posta
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6 mx-auto max-w-3xl" ref={formRef}>
      <input
        type="text"
        name="content"
        placeholder="Co słychać? Dodaj nowy post..."
        value={newPost.content}
        onChange={handleInputChange}
        className="w-full p-2 bg-gray-700 text-white rounded mb-2 hover:bg-gray-600"
        onClick={() => setIsFormOpen(true)} // Otwórz formularz po kliknięciu
      />
      
      {isFormOpen && ( // Wyświetl dodatkowe opcje tylko po otwarciu formularza
        <>
          <div className="flex items-center relative">
            <span className="mr-2 ml-1 text-orange-300">Dodaj do posta:</span>
            <button type="button" onClick={() => inputFileRef.current.click()} className="p-2 bg-gray-700 text-white rounded">
              <i className="fa-solid fa-camera"></i>
            </button>
            <input
              type="file"
              accept="image/*"
              multiple // Pozwala na wybranie wielu zdjęć
              onChange={handleImageChange}
              ref={inputFileRef}
              className="hidden"
            />
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 bg-gray-700 text-white rounded ml-2">
              <i className="fa-solid fa-smile"></i>
            </button>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                style={{ position: 'absolute', zIndex: 100, top: '50px', left: '0' }} // Ustawienie Emoji Picker nad formularzem
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          
          {/* Podgląd obrazów */}
          <div className="flex flex-wrap gap-2 mt-2">
            {newPost.imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-32 h-auto object-cover rounded opacity-60"
                />
                {/* Przyciski do usunięcia zdjęcia */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <button onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full mt-2" disabled={uploading}>
            {uploading ? "Wysyłanie..." : "Dodaj Post"}
          </button>
        </>
      )}
    </div>
  );
};

// Dodaj walidację `props` za pomocą PropTypes
PostForm.propTypes = {
  handleSubmitPost: PropTypes.func.isRequired, // Walidacja funkcji
};

export default PostForm;
