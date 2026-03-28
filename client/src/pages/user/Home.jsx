import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Film, Tv, Clock, MapPin, Search, X } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("movies");
  const [selectedMovie, setSelectedMovie] = useState(null);

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

  const filteredShows = shows.filter((s) => {
    const notStarted = new Date(s.rawStartTime) > new Date();
    const matchesSearch =
      s.movie?.title.toLowerCase().includes(search.toLowerCase()) ||
      s.theatre?.name.toLowerCase().includes(search.toLowerCase());
    const matchesMovie = selectedMovie ? s.movie?.id === selectedMovie.id : true;
    return notStarted && matchesSearch && matchesMovie;
  });

  const getAvailableShowCount = (movieId) =>
    shows.filter(
      (s) => s.movie?.id === movieId && new Date(s.rawStartTime) > new Date()
    ).length;

  return (
    <div className="min-h-screen bg-dark pb-20 md:pb-0">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-dark px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 leading-tight">
            Book Your{" "}
            <span className="text-primary">Perfect</span>{" "}
            <br className="sm:hidden" />
            Movie Experience
          </h1>
          <p className="text-muted text-sm sm:text-lg mb-6 sm:mb-8">
            Choose from the latest movies and shows near you
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search movies or theatres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-white rounded-2xl pl-10 pr-10 py-3 outline-none focus:border-primary transition text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Tabs — full width on mobile */}
        <div className="grid grid-cols-2 gap-2 mb-5 sm:flex sm:w-auto">
          <button
            onClick={() => setActiveTab("movies")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition
              ${activeTab === "movies"
                ? "bg-primary text-white"
                : "bg-card border border-border text-muted hover:text-white"}`}
          >
            <Film size={15} />
            <span>Movies</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "movies" ? "bg-white/20" : "bg-border"}`}>
              {filteredMovies.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("shows");
              setSelectedMovie(null);
            }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition
              ${activeTab === "shows"
                ? "bg-primary text-white"
                : "bg-card border border-border text-muted hover:text-white"}`}
          >
            <Tv size={15} />
            <span>Shows</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "shows" ? "bg-white/20" : "bg-border"}`}>
              {filteredShows.length}
            </span>
          </button>
        </div>

        {/* Active movie filter pill */}
        {activeTab === "shows" && selectedMovie && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-muted text-xs sm:text-sm">Showing shows for:</span>
            <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1 rounded-full font-medium">
              {selectedMovie.title}
            </span>
            <button
              onClick={() => setSelectedMovie(null)}
              className="flex items-center gap-1 text-muted text-xs hover:text-white transition"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-36 sm:h-40 animate-pulse" />
            ))}
          </div>
        ) : activeTab === "movies" ? (

          /* ── Movies Grid ── */
          filteredMovies.length === 0 ? (
            <div className="text-center py-16">
              <Film size={36} className="text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">No movies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredMovies.map((movie) => {
                const availableShows = getAvailableShowCount(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => {
                      setSelectedMovie(movie);
                      setActiveTab("shows");
                    }}
                    className="bg-card border border-border rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-primary/50 active:scale-[0.98] transition group"
                  >
                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition">
                      <Film size={18} className="text-primary sm:hidden" />
                      <Film size={22} className="text-primary hidden sm:block" />
                    </div>
                    <h3 className="text-white font-semibold font-heading text-sm sm:text-base mb-1 line-clamp-2 leading-snug">
                      {movie.title}
                    </h3>
                    <p className="text-muted text-xs sm:text-sm flex items-center gap-1">
                      <Clock size={11} />
                      {movie.duration} mins
                    </p>
                    <p className={`text-xs mt-2 ${availableShows > 0 ? "text-primary" : "text-muted"}`}>
                      {availableShows} show{availableShows !== 1 ? "s" : ""} available
                    </p>
                  </div>
                );
              })}
            </div>
          )

        ) : (

          /* ── Shows Grid ── */
          filteredShows.length === 0 ? (
            <div className="text-center py-16">
              <Tv size={36} className="text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">
                {selectedMovie
                  ? `No shows available for ${selectedMovie.title}`
                  : "No shows found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredShows.map((show) => (
                <div
                  key={show.id}
                  onClick={() => navigate(`/shows/${show.id}`)}
                  className="bg-card border border-border rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-primary/50 active:scale-[0.98] transition group"
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-white font-semibold font-heading text-sm sm:text-base group-hover:text-primary transition line-clamp-2 leading-snug">
                      {show.movie?.title}
                    </h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                      {show.showType}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-muted text-xs sm:text-sm flex items-start gap-1.5">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{show.theatre?.name}, {show.theatre?.location}</span>
                    </p>
                    <p className="text-muted text-xs sm:text-sm flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0" />
                      <span className="line-clamp-1">{show.startTime}</span>
                    </p>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-base">₹{show.regularPrice}</p>
                      {show.hasGoldenSeats && (
                        <p className="text-yellow-400 text-xs truncate">Golden: ₹{show.goldenPrice}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/shows/${show.id}`);
                      }}
                      className="bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs px-3 sm:px-4 py-2 rounded-xl transition shrink-0"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Home;