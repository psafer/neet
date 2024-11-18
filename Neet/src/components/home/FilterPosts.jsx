import PropTypes from "prop-types";
import { HomeIcon, UserGroupIcon } from "@heroicons/react/24/solid";

const FilterPosts = ({ currentFilter, setFilter }) => {
  return (
    <div className="w-full max-w-3xl flex justify-center mb-4">
      <button
        onClick={() => setFilter("all")}
        className={`px-4 py-2 w-1/2 flex justify-center items-center ${
          currentFilter === "all"
            ? "bg-orange-500 text-white"
            : "bg-gray-600 text-gray-200"
        } rounded-l-lg focus:outline-none`}
      >
        <HomeIcon className="h-5 w-5 mr-1" />
      </button>
      <button
        onClick={() => setFilter("friends")}
        className={`px-4 py-2 w-1/2 flex justify-center items-center ${
          currentFilter === "friends"
            ? "bg-orange-500 text-white"
            : "bg-gray-600 text-gray-200"
        } rounded-r-lg focus:outline-none`}
      >
        <UserGroupIcon className="h-5 w-5 mr-1" />
      </button>
    </div>
  );
};

FilterPosts.propTypes = {
  currentFilter: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
};

export default FilterPosts;
