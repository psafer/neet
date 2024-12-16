import PropTypes from "prop-types";

const EditProfileSettings = ({
  formData,
  handleChange,
  handleFileChange,
  handleSave,
  setEditing,
}) => {
  return (
    <form onSubmit={handleSave} className="w-full">
      <div className="mb-4">
        <label className="block text-orange-500 text-sm font-bold mb-2">
          Imię:
        </label>
        <input
          type="text"
          name="firstName"
          className="shadow border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 focus:ring-2 focus:ring-orange-500"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-orange-500 text-sm font-bold mb-2">
          Nazwisko:
        </label>
        <input
          type="text"
          name="lastName"
          className="shadow border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 focus:ring-2 focus:ring-orange-500"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-orange-500 text-sm font-bold mb-2">
          Opis:
        </label>
        <textarea
          name="bio"
          className="shadow border border-orange-500 rounded w-full py-2 px-3 text-gray-200 bg-gray-700 focus:ring-2 focus:ring-orange-500"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-orange-500 text-sm font-bold mb-2">
          Zdjęcie profilowe:
        </label>
        <input
          type="file"
          onChange={handleFileChange}
          className="text-gray-200"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:ring-2 focus:ring-orange-500"
        >
          Zapisz
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:ring-2 focus:ring-gray-500"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
};

EditProfileSettings.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleFileChange: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
  setEditing: PropTypes.func.isRequired,
};

export default EditProfileSettings;
