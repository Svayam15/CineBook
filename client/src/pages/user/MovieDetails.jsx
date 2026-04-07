import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Clock, MapPin, Calendar, ArrowLeft, Film, Star } from "lucide-react";

const RATING_COLORS = {
  U: "bg-green-100 text-green-700 border-green-200",
  UA: "bg-yellow-100 text-yellow-700 border-yellow-200",
  A: "bg-red-100 text-red-700 border-red-200",
  S: "bg-blue-100 text-blue-700 border-blue-200",
};

const RATING_LABELS = {
  U: "Universal",
  UA: "Parental Guidance",
  A: "Adults Only",
  S: "Special",
};

const formatIST = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await api.get(`/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Movie not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchMovie().catch(console.error);
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading movie...</p>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row gap-6 mb-8">

          {/* Poster */}
          <div className="w-full sm:w-48 flex-shrink-0">
            <div className="w-full sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {movie.posterUrl ? (
                <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film size={40} className="text-gray-300" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {movie.title}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.rating && (
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${RATING_COLORS[movie.rating]}`}>
                  {movie.rating} · {RATING_LABELS[movie.rating]}
                </span>
              )}
              {movie.language && (
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {movie.language}
                </span>
              )}
              {movie.genre && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {movie.genre}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock size={14} className="text-primary" />
                <span>{movie.duration} minutes</span>
              </div>
              {movie.releaseDate && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar size={14} className="text-primary" />
                  <span>Released {formatDate(movie.releaseDate)}</span>
                </div>
              )}
              {movie.director && (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Star size={14} className="text-primary" />
                  <span>Director: <span className="text-gray-900">{movie.director}</span></span>
                </div>
              )}
            </div>

            {/* Cast */}
            {movie.cast && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Cast</p>
                <p className="text-gray-900 text-sm">{movie.cast}</p>
              </div>
            )}

            {/* Description */}
            {movie.description && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Synopsis</p>
                <p className="text-gray-600 text-sm leading-relaxed">{movie.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Shows Section */}
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
            Available Shows
            {movie.shows?.length > 0 && (
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({movie.shows.length} show{movie.shows.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>

          {!movie.shows || movie.shows.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl">
              <Film size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No upcoming shows available for this movie</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {movie.shows.map((show) => (
                <div
                  key={show.id}
                  onClick={() => navigate(`/shows/${show.id}`)}
                  className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-primary/50 active:scale-[0.98] transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">{show.theatre?.name}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {show.theatre?.location}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0">
                      {show.showType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-3">
                    <Clock size={11} />
                    {formatIST(show.startTime)}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">₹{show.regularPrice}</p>
                      {show.hasGoldenSeats && (
                        <p className="text-yellow-600 text-xs">Golden: ₹{show.goldenPrice}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/shows/${show.id}`); }}
                      className="bg-primary hover:bg-primary-dark text-white text-xs px-4 py-2 rounded-xl transition active:scale-95"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;