import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Film, Clock, MapPin, Search, X, ChevronRight } from "lucide-react";

const RATING_COLORS = {
  U:  "bg-green-100 text-green-700",
  UA: "bg-yellow-100 text-yellow-700",
  A:  "bg-red-100 text-red-700",
  S:  "bg-blue-100 text-blue-700",
};

const formatIST = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const Home = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, showsRes] = await Promise.all([
          api.get("/movies"),
          api.get("/shows"),
        ]);
        setMovies(moviesRes.data);
        setShows(showsRes.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData().catch(console.error);
  }, []);

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const upcomingShows = shows.filter(
    (s) => new Date(s.rawStartTime) > new Date()
  );

  const getAvailableShowCount = (movieId) =>
    shows.filter(
      (s) => s.movie?.id === movieId && new Date(s.rawStartTime) > new Date()
    ).length;

  // Featured movie — first with available shows
  const featuredMovie = movies.find((m) => getAvailableShowCount(m.id) > 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar />

      {/* ── DESKTOP: District-style hero banner ── */}
      {featuredMovie && (
        <div className="hidden md:block relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 min-h-[420px]">
          {/* Background poster blur */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 scale-105"
            style={{ backgroundImage: `url(${featuredMovie.posterUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/60 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 py-14 flex items-center gap-12">
            {/* Text */}
            <div className="flex-1 max-w-xl">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {featuredMovie.rating && (
                  <span className="text-xs bg-white/10 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                    {featuredMovie.rating}
                  </span>
                )}
                {featuredMovie.genres?.slice(0, 2).map((g) => (
                  <span key={g} className="text-xs bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full">
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="font-heading text-4xl font-bold text-white mb-3 leading-tight">
                {featuredMovie.title}
              </h1>
              <p className="text-white/60 text-sm mb-6 line-clamp-2 leading-relaxed">
                {featuredMovie.description}
              </p>
              <button
                onClick={() => navigate(`/movies/${featuredMovie.id}`)}
                className="bg-white text-gray-900 font-bold px-8 py-3 rounded-full text-sm hover:bg-gray-100 transition"
              >
                Book now
              </button>
            </div>

            {/* Poster */}
            <div className="hidden lg:block shrink-0">
              <img
                src={featuredMovie.posterUrl}
                alt={featuredMovie.title}
                className="w-56 h-80 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>

          {/* Slide dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <span className="w-6 h-1.5 rounded-full bg-white" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      )}

      {/* ── MOBILE: BMS-style header ── */}
      <div className="md:hidden bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">It All Starts Here!</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-600">
              <Search size={22} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search movies or theatres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-100 text-gray-900 rounded-xl pl-9 pr-9 py-2.5 outline-none text-sm placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop search bar ── */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 py-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search movies or theatres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 rounded-2xl pl-10 pr-10 py-3 outline-none focus:border-primary transition text-sm shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">

        {/* ── Movies Section ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-gray-900">
              {search ? `Results for "${search}"` : "Now Showing"}
            </h2>
            {!search && (
              <button className="flex items-center gap-1 text-primary text-sm font-medium">
                See All <ChevronRight size={16} />
              </button>
            )}
          </div>

          {loading ? (
            /* Loading skeletons */
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:overflow-visible">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shrink-0 w-36 md:w-auto bg-gray-100 rounded-2xl aspect-[2/3] animate-pulse" />
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-16">
              <Film size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No movies found</p>
            </div>
          ) : (
            /* ── Mobile: horizontal scroll (BMS style) | Desktop: grid (District style) ── */
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:overflow-visible md:pb-0">
              {filteredMovies.map((movie) => {
                const availableShows = getAvailableShowCount(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => navigate(`/movies/${movie.id}`)}
                    className="shrink-0 w-36 md:w-auto cursor-pointer group"
                  >
                    {/* Poster */}
                    <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-gray-100 mb-2 shadow-sm">
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={32} className="text-gray-300" />
                        </div>
                      )}
                      {movie.rating && (
                        <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[movie.rating]}`}>
                          {movie.rating}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-gray-900 font-semibold text-sm line-clamp-1 leading-snug">
                        {movie.title}
                      </h3>
                      <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {movie.duration} mins
                      </p>
                      {availableShows > 0 && (
                        <p className="text-primary text-xs mt-0.5 font-medium">
                          {availableShows} show{availableShows !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Upcoming Shows Section ── */}
        {!search && upcomingShows.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-gray-900">Upcoming Shows</h2>
              <button className="flex items-center gap-1 text-primary text-sm font-medium">
                See All <ChevronRight size={16} />
              </button>
            </div>

            {/* Mobile: horizontal scroll | Desktop: grid */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
              {upcomingShows.slice(0, 6).map((show) => (
                <div
                  key={show.id}
                  onClick={() => navigate(`/shows/${show.id}`)}
                  className="shrink-0 w-72 md:w-auto bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition group"
                >
                  {/* Poster strip */}
                  {show.movie?.posterUrl && (
                    <div className="w-full h-28 overflow-hidden relative">
                      <img
                        src={show.movie.posterUrl}
                        alt={show.movie.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-300 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                      {show.movie?.rating && (
                        <span className={`absolute top-2 left-3 text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[show.movie.rating]}`}>
                          {show.movie.rating}
                        </span>
                      )}
                      <span className="absolute top-2 right-3 text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                        {show.showType}
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="text-gray-900 font-semibold text-sm line-clamp-1 mb-2">
                      {show.movie?.title}
                    </h3>
                    <div className="space-y-1 mb-3">
                      <p className="text-gray-500 text-xs flex items-center gap-1.5">
                        <MapPin size={11} className="shrink-0 text-primary" />
                        <span className="line-clamp-1">{show.theatre?.name}, {show.theatre?.location}</span>
                      </p>
                      <p className="text-gray-500 text-xs flex items-center gap-1.5">
                        <Clock size={11} className="shrink-0 text-primary" />
                        {formatIST(show.rawStartTime || show.startTime)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-gray-900 font-bold text-sm">₹{show.regularPrice}</p>
                        {show.hasGoldenSeats && (
                          <p className="text-yellow-600 text-xs">Golden: ₹{show.goldenPrice}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/shows/${show.id}`); }}
                        className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2 rounded-full transition"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;