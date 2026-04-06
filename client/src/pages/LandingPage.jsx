import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Clock, MapPin, Search, ChevronRight, Ticket, Star, Zap } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-64 bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
    <div className="h-36 bg-zinc-800" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  </div>
);

// ─── Show Card ────────────────────────────────────────────────────────────────
const ShowCard = ({ show, onBook }) => (
  <div
    onClick={() => onBook(show.id)}
    className="flex-shrink-0 w-64 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
  >
    {/* Color accent bar */}
    <div className="h-1 bg-gradient-to-r from-primary to-purple-400" />

    {/* Card header */}
    <div className="relative h-32 bg-gradient-to-br from-primary/20 via-dark to-dark flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.3),transparent_60%)]" />
      <Film size={40} className="text-primary/30 group-hover:text-primary/50 transition-all duration-300 group-hover:scale-110" />
      <div className="absolute top-3 right-3">
        <span className="text-xs bg-primary/20 border border-primary/30 text-primary px-2 py-0.5 rounded-full font-semibold">
          {show.showType}
        </span>
      </div>
      {show.hasGoldenSeats && (
        <div className="absolute top-3 left-3">
          <span className="text-xs bg-golden/20 border border-golden/30 text-golden px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Star size={9} fill="currentColor" /> VIP
          </span>
        </div>
      )}
    </div>

    <div className="p-4">
      <h3 className="text-white font-heading font-bold text-sm mb-3 line-clamp-1 group-hover:text-primary transition-colors">
        {show.movie?.title}
      </h3>

      <div className="space-y-1.5 mb-4">
        <p className="text-muted text-xs flex items-center gap-1.5 line-clamp-1">
          <MapPin size={11} className="shrink-0 text-primary/60" />
          {show.theatre?.name}, {show.theatre?.location}
        </p>
        <p className="text-muted text-xs flex items-center gap-1.5">
          <Clock size={11} className="shrink-0 text-primary/60" />
          {show.startTime}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <p className="text-white font-bold text-sm">₹{show.regularPrice}</p>
          {show.hasGoldenSeats && (
            <p className="text-golden text-xs">VIP ₹{show.goldenPrice}</p>
          )}
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1">
          Book <ChevronRight size={11} />
        </button>
      </div>
    </div>
  </div>
);

// ─── Movie Card ───────────────────────────────────────────────────────────────
const MovieCard = ({ movie, showCount }) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/40 hover:-translate-y-1 transition-all duration-300">
    <div className="h-1 bg-gradient-to-r from-golden to-amber-400" />
    <div className="relative h-28 bg-gradient-to-br from-golden/10 via-dark to-dark flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_60%)]" />
      <Film size={32} className="text-golden/30 group-hover:text-golden/50 transition-all duration-300 group-hover:scale-110" />
    </div>
    <div className="p-4">
      <h3 className="text-white font-heading font-bold text-sm mb-1 line-clamp-1">{movie.title}</h3>
      <p className="text-muted text-xs flex items-center gap-1 mb-2">
        <Clock size={11} /> {movie.duration} mins
      </p>
      <p className={`text-xs font-medium ${showCount > 0 ? "text-primary" : "text-muted"}`}>
        {showCount} show{showCount !== 1 ? "s" : ""} available
      </p>
    </div>
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
      <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-white hidden sm:block">
              Cine<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Search — center */}
          <div className="flex-1 max-w-sm relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search movies, theatres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-white rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary transition placeholder:text-muted"
            />
          </div>

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              className="text-sm text-muted hover:text-white transition px-3 py-2"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary-dark text-white text-sm px-4 py-2 rounded-xl transition font-semibold flex items-center gap-1.5"
            >
              Sign Up <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.3),transparent)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-golden/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs px-4 py-2 rounded-full mb-8 font-medium">
            <Zap size={12} fill="currentColor" />
            Instant seat booking · Zero waiting
          </div>

          {/* Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
            Cinema tickets,{" "}
            <span className="relative inline-block">
              <span className="text-primary">booked instantly</span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-400 rounded-full" />
            </span>
            <br className="hidden sm:block" />
            {" "}no hassle.
          </h1>

          <p className="text-muted text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Browse shows, pick your seats, and confirm your booking in under 60 seconds.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-10">
            {[
              { value: movies.length || "—", label: "Movies" },
              { value: shows.length || "—", label: "Shows today" },
              { value: "60s", label: "Avg booking time" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-heading text-2xl font-bold text-white">{value}</p>
                <p className="text-muted text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-10">
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3.5 rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-primary/25"
            >
              <Ticket size={16} />
              Start Booking
            </Link>
            <Link
              to="/login"
              className="bg-card border border-border hover:border-primary/50 text-white font-medium px-8 py-3.5 rounded-xl transition text-sm"
            >
              Already a member? Login
            </Link>
          </div>

          {/* Mobile search */}
          <div className="relative max-w-sm mx-auto md:hidden">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search movies, theatres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-white rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary transition placeholder:text-muted"
            />
          </div>
        </div>
      </section>

      {/* ── Now Showing ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Now Showing</h2>
            <p className="text-muted text-xs mt-0.5">{filteredShows.length} shows available</p>
          </div>
          <Link
            to="/login"
            className="text-primary text-xs font-medium hover:text-purple-400 transition flex items-center gap-1"
          >
            View all <ChevronRight size={13} />
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {loading
            ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
            : filteredShows.length === 0
            ? (
              <div className="flex-1 text-center py-16">
                <Film size={36} className="text-muted mx-auto mb-3" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── Movies ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Movies</h2>
            <p className="text-muted text-xs mt-0.5">{filteredMovies.length} movies</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16">
            <Film size={36} className="text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">No movies found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                showCount={getShowCount(movie.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 px-8 py-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15),transparent_70%)]" />
          <div className="relative">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to book your seat?
            </h2>
            <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
              Create a free account and get your tickets in under 60 seconds.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm shadow-lg shadow-primary/25"
            >
              <Ticket size={16} />
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-4 sm:px-6 py-6 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Film size={12} className="text-white" />
            </div>
            <span className="font-heading font-bold text-white text-sm">
              Cine<span className="text-primary">Book</span>
            </span>
          </div>
          <p className="text-muted text-xs text-center">
            © 2026 CineBook · Made by Svayam Shanishwara
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-muted hover:text-white text-xs transition">Login</Link>
            <Link to="/signup" className="text-muted hover:text-white text-xs transition">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;