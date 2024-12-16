import { useRef, useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import PropTypes from "prop-types";
import { storage } from "../../firebaseConfig";

const PostForm = ({ handleSubmitPost }) => {
  // Stan formularza postu
  const [newPost, setNewPost] = useState({
    content: "", // Tekst postu
    images: [], // Lista wybranych obrazów
    imagePreviews: [], // Podgląd obrazów
    videos: [], // Lista wybranych filmów
    videoPreviews: [], // Podgląd filmów
    audio: [], // Lista wybranych plików audio
    audioPreviews: [], // Podgląd plików audio (nazwy plików)
  });
  const [uploading, setUploading] = useState(false); // Czy trwa wysyłanie danych
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Czy Emoji Picker jest widoczny
  const [isFormOpen, setIsFormOpen] = useState(false); // Czy formularz jest otwarty

  // Referencje do pól wyboru plików i formularza
  const inputFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const audioFileRef = useRef(null);
  const formRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Nasłuchiwanie kliknięć poza formularzem lub Emoji Pickerem
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setIsFormOpen(false); // Zamknij formularz
      }

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false); // Ukryj Emoji Picker
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obsługa zmiany tekstu w formularzu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prev) => ({ ...prev, [name]: value }));
  };

  // Dodawanie emoji do tekstu
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    setNewPost((prevPost) => ({
      ...prevPost,
      content: prevPost.content + emoji,
    }));
  };

  // Obsługa wyboru obrazów
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files); // Pobranie plików
    const imagePreviews = files.map((file) => URL.createObjectURL(file)); // Tworzenie podglądu obrazów

    setNewPost((prevPost) => ({
      ...prevPost,
      images: [...prevPost.images, ...files],
      imagePreviews: [...prevPost.imagePreviews, ...imagePreviews],
    }));
  };

  // Obsługa wyboru wideo
  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const videoPreviews = files.map((file) => URL.createObjectURL(file));

    setNewPost((prevPost) => ({
      ...prevPost,
      videos: [...prevPost.videos, ...files],
      videoPreviews: [...prevPost.videoPreviews, ...videoPreviews],
    }));
  };

  // Obsługa wyboru audio
  const handleAudioChange = (e) => {
    const files = Array.from(e.target.files);
    const audioPreviews = files.map((file) => file.name); // Wyświetlanie nazw plików

    setNewPost((prevPost) => ({
      ...prevPost,
      audio: [...prevPost.audio, ...files],
      audioPreviews: [...prevPost.audioPreviews, ...audioPreviews],
    }));
  };

  // Usuwanie wybranego obrazu
  const handleRemoveImage = (index) => {
    setNewPost((prevPost) => {
      const updatedImages = [...prevPost.images];
      const updatedPreviews = [...prevPost.imagePreviews];

      updatedImages.splice(index, 1);
      updatedPreviews.splice(index, 1);

      return {
        ...prevPost,
        images: updatedImages,
        imagePreviews: updatedPreviews,
      };
    });
  };

  // Usuwanie wybranego wideo
  const handleRemoveVideo = (index) => {
    setNewPost((prevPost) => {
      const updatedVideos = [...prevPost.videos];
      const updatedVideoPreviews = [...prevPost.videoPreviews];

      updatedVideos.splice(index, 1);
      updatedVideoPreviews.splice(index, 1);

      return {
        ...prevPost,
        videos: updatedVideos,
        videoPreviews: updatedVideoPreviews,
      };
    });
  };

  // Usuwanie wybranego audio
  const handleRemoveAudio = (index) => {
    setNewPost((prevPost) => {
      const updatedAudio = [...prevPost.audio];
      const updatedAudioPreviews = [...prevPost.audioPreviews];

      updatedAudio.splice(index, 1);
      updatedAudioPreviews.splice(index, 1);

      return {
        ...prevPost,
        audio: updatedAudio,
        audioPreviews: updatedAudioPreviews,
      };
    });
  };

  // Wysłanie formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Upload obrazów
      const uploadedImageUrls = await Promise.all(
        newPost.images.map(async (image) => {
          const storageRef = ref(storage, `posts/images/${image.name}`);
          const uploadTask = uploadBytesResumable(storageRef, image);
          const snapshot = await uploadTask;
          return await getDownloadURL(snapshot.ref);
        })
      );

      // Upload wideo
      const uploadedVideoUrls = await Promise.all(
        newPost.videos.map(async (video) => {
          const storageRef = ref(storage, `posts/videos/${video.name}`);
          const uploadTask = uploadBytesResumable(storageRef, video);
          const snapshot = await uploadTask;
          return await getDownloadURL(snapshot.ref);
        })
      );

      // Upload audio
      const uploadedAudioUrls = await Promise.all(
        newPost.audio.map(async (audioFile) => {
          const storageRef = ref(storage, `posts/audio/${audioFile.name}`);
          const uploadTask = uploadBytesResumable(storageRef, audioFile);
          const snapshot = await uploadTask;
          return await getDownloadURL(snapshot.ref);
        })
      );

      // Wywołanie funkcji przekazanej jako props z zebranymi danymi
      handleSubmitPost(
        newPost.content,
        uploadedImageUrls,
        uploadedVideoUrls.length > 0 ? uploadedVideoUrls : null,
        uploadedAudioUrls.length > 0 ? uploadedAudioUrls : null
      );

      // Reset formularza
      setNewPost({
        content: "",
        images: [],
        imagePreviews: [],
        videos: [],
        videoPreviews: [],
        audio: [],
        audioPreviews: [],
      });
      setIsFormOpen(false);
    } catch (error) {
      console.error("Błąd podczas przesyłania postu:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="bg-gray-800 p-4 rounded-lg mb-1 w-full max-w-3xl"
      ref={formRef}
    >
      <input
        type="text"
        name="content"
        placeholder="Co słychać? Dodaj nowy post..."
        value={newPost.content}
        onChange={handleInputChange}
        className="w-full p-2 bg-gray-700 text-white rounded mb-2 hover:bg-gray-600"
        onClick={() => setIsFormOpen(true)}
        autoComplete="off"
      />

      {isFormOpen && (
        <>
          <div className="flex items-center relative">
            <span className="mr-2 ml-1 text-orange-300">Dodaj do posta:</span>
            {/* Przycisk dodania obrazu */}
            <button
              type="button"
              onClick={() => inputFileRef.current.click()}
              className="p-2 bg-gray-700 text-white rounded"
            >
              <i className="fa-solid fa-camera"></i>
            </button>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              ref={inputFileRef}
              className="hidden"
            />
            {/* Przycisk dodania wideo */}
            <button
              type="button"
              onClick={() => videoFileRef.current.click()}
              className="p-2 bg-gray-700 text-white rounded ml-2"
            >
              <i className="fa-solid fa-video"></i>
            </button>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoChange}
              ref={videoFileRef}
              className="hidden"
            />
            {/* Przycisk dodania audio */}
            <button
              type="button"
              onClick={() => audioFileRef.current.click()}
              className="p-2 bg-gray-700 text-white rounded ml-2"
            >
              <i className="fa-solid fa-music"></i>
            </button>
            <input
              type="file"
              accept=".mp3, .wav, .flac"
              multiple
              onChange={handleAudioChange}
              ref={audioFileRef}
              className="hidden"
            />
            {/* Przycisk otwarcia Emoji Picker */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 bg-gray-700 text-white rounded ml-2"
            >
              <i className="fa-solid fa-smile"></i>
            </button>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                style={{
                  position: "absolute",
                  zIndex: 100,
                  top: "50px",
                  left: "0",
                }}
              >
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>

          {/* Podgląd wybranych plików */}
          <div className="flex flex-wrap gap-2 mt-2">
            {newPost.imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-32 h-auto object-cover rounded opacity-60"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            {newPost.videoPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <video
                  src={preview}
                  controls
                  className="w-32 h-auto object-cover rounded opacity-60"
                ></video>
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            {newPost.audioPreviews.map((preview, index) => (
              <div key={index} className="relative pr-6">
                <p className="text-white opacity-60">{preview}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveAudio(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5  flex items-center justify-center hover:bg-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full mt-2"
            disabled={uploading}
          >
            {uploading ? "Wysyłanie..." : "Dodaj Post"}
          </button>
        </>
      )}
    </div>
  );
};

PostForm.propTypes = {
  handleSubmitPost: PropTypes.func.isRequired,
};

export default PostForm;
