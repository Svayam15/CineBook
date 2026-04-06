import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Clock, MapPin, Search, ChevronRight, Star, X } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

// ─── Show Card ────────────────────────────────────────────────────────────────
const ShowCard = ({ show, onBook }) => (
  <div
    onClick={() => onBook(show.id)}
    className="flex-shrink-0 w-56 sm:w-64 cursor-pointer group"
  >
    {/* Poster area */}
    <div className="relative h-36 sm:h-40 bg-gradient-to-br from-primary/30 via-zinc-900 to-zinc-900 rounded-xl overflow-hidden mb-3 border border-border group-hover:border-primary/50 transition-all duration-300 group-hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.4),transparent_60%)]" />
      <Film size={36} className="absolute bottom-3 right-3 text-primary/20 group-hover:text-primary/40 transition-all duration-300" />

      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
        <span className="text-[10px] bg-black/60 backdrop-blur-sm border border-white/10 text-white px-2 py-0.5 rounded-md font-semibold">
          {show.showType}
        </span>
        {show.hasGoldenSeats && (
          <span className="text-[10px] bg-golden/20 border border-golden/30 text-golden px-2 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
            <Star size={8} fill="currentColor" /> VIP
          </span>
        )}
      </div>

      {/* Price bottom */}
      <div className="absolute bottom-2.5 left-2.5">
        <span className="text-white font-bold text-sm">₹{show.regularPrice}</span>
      </div>
    </div>

    {/* Info */}
    <div className="px-0.5">
      <h3 className="text-white font-heading font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
        {show.movie?.title}
      </h3>
      <p className="text-muted text-xs flex items-center gap-1 mb-0.5 line-clamp-1">
        <MapPin size={10} className="shrink-0" />
        {show.theatre?.name}
      </p>
      <p className="text-muted text-xs flex items-center gap-1">
        <Clock size={10} className="shrink-0" />
        {show.startTime}
      </p>
    </div>
  </div>
);

// ─── Movie Card ───────────────────────────────────────────────────────────────
const MovieCard = ({ movie, showCount, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer group"
  >
    <div className="relative h-40 sm:h-48 bg-gradient-to-br from-golden/20 via-zinc-900 to-zinc-900 rounded-xl overflow-hidden mb-2.5 border border-border group-hover:border-golden/40 transition-all duration-300 group-hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.2),transparent_60%)]" />
      <Film size={32} className="absolute bottom-3 right-3 text-golden/20 group-hover:text-golden/40 transition-all duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-2.5 left-2.5">
        <span className={`text-xs font-medium ${showCount > 0 ? "text-primary" : "text-muted"}`}>
          {showCount} show{showCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
    <h3 className="text-white font-heading font-semibold text-xs sm:text-sm line-clamp-1 group-hover:text-golden transition-colors px-0.5">
      {movie.title}
    </h3>
    <p className="text-muted text-xs flex items-center gap-1 mt-0.5 px-0.5">
      <Clock size={10} /> {movie.duration} mins
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const LandingPage = () => {
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

  const handleBookNow = (showId) => {
    navigate("/login", { state: { redirect: `/shows/${showId}` } });
  };

  const filteredShows = shows.filter((s) =>
    s.movie?.title.toLowerCase().includes(search.toLowerCase()) ||
    s.theatre?.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const getShowCount = (movieId) =>
    shows.filter((s) => s.movie?.id === movieId).length;

  return (
    <div className="min-h-screen bg-dark">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-dark/90 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3 sm:gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film size={14} className="text-white" />
            </div>
            <span className="font-heading text-base sm:text-lg font-bold text-white">
              Cine<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Search — center, flex-1 */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search movies or theatres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-white rounded-xl pl-9 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-primary transition placeholder:text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/login"
              className="text-xs sm:text-sm text-muted hover:text-white transition px-2 sm:px-3 py-2 hidden sm:block"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl transition font-semibold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Now Showing ── */}
        <section className="pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white">Now Showing</h2>
              <p className="text-muted text-xs mt-0.5">{filteredShows.length} shows available</p>
            </div>
            <Link
              to="/login"
              className="text-primary text-xs font-medium hover:text-purple-400 transition flex items-center gap-0.5"
            >
              See all <ChevronRight size={13} />
            </Link>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading
              ? [...Array(5)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-56 sm:w-64">
                  <div className="h-36 sm:h-40 bg-card border border-border rounded-xl animate-pulse mb-3" />
                  <div className="h-3 bg-card rounded w-3/4 mb-1.5 animate-pulse" />
                  <div className="h-2.5 bg-card rounded w-1/2 animate-pulse" />
                </div>
              ))
              : filteredShows.length === 0
              ? (
                <div className="flex-1 text-center py-12">
                  <Film size={32} className="text-muted mx-auto mb-3" />
                  <p className="text-muted text-sm">No shows found</p>
                </div>
              )
              : filteredShows.map((show) => (
                <ShowCard key={show.id} show={show} onBook={handleBookNow} />
              ))
            }
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-border/50" />

        {/* ── Movies ── */}
        <section className="py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white">Movies</h2>
              <p className="text-muted text-xs mt-0.5">{filteredMovies.length} movies</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-40 sm:h-48 bg-card border border-border rounded-xl animate-pulse mb-2.5" />
                  <div className="h-3 bg-card rounded w-3/4 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-12">
              <Film size={32} className="text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">No movies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  showCount={getShowCount(movie.id)}
                  onClick={() => navigate("/login")}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-4 px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Film size={12} className="text-white" />
            </div>
            <span className="font-heading font-bold text-white text-sm">
              Cine<span className="text-primary">Book</span>
            </span>
          </div>
          <p className="text-muted text-xs">
            © 2026 CineBook · Made by Svayam Shanishwara
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-muted hover:text-white text-xs transition">Privacy Policy</a>
            <a href="#" className="text-muted hover:text-white text-xs transition">Terms of Use</a>
            <a href="#" className="text-muted hover:text-white text-xs transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;