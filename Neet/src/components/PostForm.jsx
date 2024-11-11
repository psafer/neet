import { useRef, useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import PropTypes from "prop-types";
import { storage } from "../firebaseConfig";

const PostForm = ({ handleSubmitPost }) => {
  const [newPost, setNewPost] = useState({
    content: "",
    images: [],
    imagePreviews: [],
  });
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const inputFileRef = useRef(null);
  const formRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setIsFormOpen(false);
      }

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePreviews = files.map((file) => URL.createObjectURL(file));

    setNewPost((prevPost) => ({
      ...prevPost,
      images: [...prevPost.images, ...files],
      imagePreviews: [...prevPost.imagePreviews, ...imagePreviews],
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

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
    setIsFormOpen(false);
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
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
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
