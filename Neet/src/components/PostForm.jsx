import { useRef, useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import PropTypes from "prop-types";
import { storage } from "../firebaseConfig";
import { HomeIcon, UserGroupIcon } from "@heroicons/react/24/solid";

const PostForm = ({ handleSubmitPost }) => {
  const [newPost, setNewPost] = useState({
    content: "",
    images: [],
    imagePreviews: [],
    videos: [],
    videoPreviews: [],
    audio: [],
    audioPreviews: [],
    privacy: "public", // Domyślnie publiczny
  });
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const inputFileRef = useRef(null);
  const videoFileRef = useRef(null);
  const audioFileRef = useRef(null);
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

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const videoPreviews = files.map((file) => URL.createObjectURL(file));

    setNewPost((prevPost) => ({
      ...prevPost,
      videos: [...prevPost.videos, ...files],
      videoPreviews: [...prevPost.videoPreviews, ...videoPreviews],
    }));
  };

  const handleAudioChange = (e) => {
    const files = Array.from(e.target.files);
    const audioPreviews = files.map((file) => file.name);

    setNewPost((prevPost) => ({
      ...prevPost,
      audio: [...prevPost.audio, ...files],
      audioPreviews: [...prevPost.audioPreviews, ...audioPreviews],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const uploadedImageUrls = await Promise.all(
      newPost.images.map(async (image) => {
        const storageRef = ref(storage, `posts/images/${image.name}`);
        const uploadTask = uploadBytesResumable(storageRef, image);
        const snapshot = await uploadTask;
        return await getDownloadURL(snapshot.ref);
      })
    );

    const uploadedVideoUrls = await Promise.all(
      newPost.videos.map(async (video) => {
        const storageRef = ref(storage, `posts/videos/${video.name}`);
        const uploadTask = uploadBytesResumable(storageRef, video);
        const snapshot = await uploadTask;
        return await getDownloadURL(snapshot.ref);
      })
    );

    const uploadedAudioUrls = await Promise.all(
      newPost.audio.map(async (audioFile) => {
        const storageRef = ref(storage, `posts/audio/${audioFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, audioFile);
        const snapshot = await uploadTask;
        return await getDownloadURL(snapshot.ref);
      })
    );

    handleSubmitPost(
      newPost.content,
      uploadedImageUrls,
      uploadedVideoUrls,
      uploadedAudioUrls,
      newPost.privacy
    );
    setUploading(false);
    setNewPost({
      content: "",
      images: [],
      imagePreviews: [],
      videos: [],
      videoPreviews: [],
      audio: [],
      audioPreviews: [],
      privacy: "public",
    });
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

          <div className="ml-1 mt-4 flex items-center">
            <span className="text-white mr-7">Opublikuj na:</span>
            <div className="flex ml- w-3/4">
              <button
                type="button"
                onClick={() =>
                  setNewPost((prev) => ({ ...prev, privacy: "public" }))
                }
                className={`py-2 w-12 flex justify-center items-center ${
                  newPost.privacy === "public"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-600 text-gray-200"
                } rounded-l-lg focus:outline-none`}
              >
                <HomeIcon className="h-5 w-5 mr-1" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setNewPost((prev) => ({ ...prev, privacy: "friends" }))
                }
                className={`py-2 w-12 flex justify-center items-center ${
                  newPost.privacy === "friends"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-600 text-gray-200"
                } rounded-r-lg focus:outline-none`}
              >
                <UserGroupIcon className="h-5 w-5 mr-1" />
              </button>
            </div>
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
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  ×
                </button>
              </div>
            ))}
            {newPost.audioPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <p className="text-white opacity-60">{preview}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveAudio(index)}
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
