import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Search, X, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const FONT_HEADING = "'Plus Jakarta Sans', sans-serif";
const FONT_BODY    = "'Manrope', sans-serif";

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
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
};

// ─── Rating Badge ─────────────────────────────────────────────────────────────
const RatingBadge = ({ rating }) => {
  if (!rating) return null;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[rating] || RATING_COLORS.U}`}>
      {rating}
    </span>
  );
};

// ─── Hero Carousel ────────────────────────────────────────────────────────────
const HeroCarousel = ({ movies, shows, onBook }) => {
  const [current, setCurrent] = useState(0);
  const featured = movies.filter((m) => m.posterUrl).slice(0, 5);

  const prev = useCallback(() =>
    setCurrent((c) => (c - 1 + featured.length) % featured.length), [featured.length]);
  const next = useCallback(() =>
    setCurrent((c) => (c + 1) % featured.length), [featured.length]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next, featured.length]);

  if (featured.length === 0) return null;

  const movie = featured[current];
  const firstShow = shows.find((s) => s.movie?.id === movie.id);

  return (
    <div className="relative overflow-hidden bg-gray-900 min-h-[340px] md:min-h-[420px]">
      {/* Blurred bg */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: `url(${movie.posterUrl})`,
          filter: "blur(2px) brightness(0.35)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/70 to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14 flex items-center gap-10 md:gap-16">
        {/* Left */}
        <div className="flex-1 max-w-lg">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {movie.rating && (
              <span className="text-xs bg-white/10 text-white/90 px-2.5 py-1 rounded-full border border-white/20 font-medium">
                {movie.rating}
              </span>
            )}
            {movie.language && (
              <span className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                {movie.language}
              </span>
            )}
            {movie.genre && (
              <span className="text-xs bg-primary/30 text-purple-300 px-2.5 py-1 rounded-full">
                {movie.genre}
              </span>
            )}
          </div>

          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-3 leading-[1.1] tracking-tight">
            {movie.title}
          </h1>

          {movie.description && (
            <p className="text-white/60 text-sm mb-6 md:mb-8 line-clamp-2 leading-relaxed">
              {movie.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => firstShow && onBook(firstShow.id)}
              className="bg-white text-gray-900 font-bold px-6 md:px-8 py-2.5 md:py-3 rounded-full text-sm hover:bg-gray-100 transition disabled:opacity-50"
              disabled={!firstShow}
            >
              Book now
            </button>
          </div>
        </div>

        {/* Poster — hidden on mobile */}
        <div className="hidden lg:block shrink-0">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-52 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10"
            style={{ height: "300px" }}
          />
        </div>
      </div>

      {/* Arrows */}
      {featured.length > 1 && (
        <>
          {[{ fn: prev, side: "left", Icon: ChevronLeft }, { fn: next, side: "right", Icon: ChevronRight }].map(({ fn, side, Icon }) => (
            <button
              key={side}
              onClick={fn}
              className={`absolute ${side}-3 md:${side}-5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition`}
            >
              <Icon size={16} />
            </button>
          ))}
        </>
      )}

      {/* Dots */}
      {featured.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 items-center">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === current ? "24px" : "6px", background: i === current ? "#fff" : "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Movie Card ───────────────────────────────────────────────────────────────
const MovieCard = ({ movie, showCount, onClick }) => (
  <div onClick={onClick} className="shrink-0 w-36 md:w-auto cursor-pointer group">
    <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 mb-2.5 shadow-sm">
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Film size={32} className="text-gray-300" />
        </div>
      )}
      {movie.rating && (
        <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[movie.rating] || RATING_COLORS.U}`}>
          {movie.rating}
        </span>
      )}
      {showCount === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="bg-black/80 text-gray-400 text-[10px] px-2 py-1 rounded-lg font-semibold">No Shows</span>
        </div>
      )}
    </div>
    <h3 className="text-gray-900 font-semibold text-sm line-clamp-1 leading-snug">{movie.title}</h3>
    <p className="text-gray-400 text-xs mt-0.5">{movie.genre}</p>
    {showCount > 0 && (
      <p className="text-primary text-xs mt-0.5 font-medium">{showCount} show{showCount !== 1 ? "s" : ""}</p>
    )}
  </div>
);

// ─── Show Card ────────────────────────────────────────────────────────────────
const ShowCard = ({ show, onClick }) => (
  <div
    onClick={onClick}
    className="shrink-0 w-72 md:w-auto bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition group"
  >
    {show.movie?.posterUrl && (
      <div className="w-full h-28 overflow-hidden relative">
        <img
          src={show.movie.posterUrl}
          alt={show.movie.title}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition duration-300 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        {show.movie?.rating && (
          <span className={`absolute top-2 left-3 text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[show.movie.rating] || RATING_COLORS.U}`}>
            {show.movie.rating}
          </span>
        )}
        <span className="absolute top-2 right-3 text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
          {show.showType}
        </span>
        {show.language && (
          <span className="absolute bottom-2 left-3 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
            {show.language}
          </span>
        )}
      </div>
    )}
    <div className="p-4">
      <h3 className="text-gray-900 font-semibold text-sm line-clamp-1 mb-2">{show.movie?.title}</h3>
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
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2 rounded-full transition"
        >
          Book Now
        </button>
      </div>
    </div>
  </div>
);

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-semibold border transition whitespace-nowrap
      ${active
        ? "bg-primary/10 border-primary text-primary"
        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
      }`}
  >
    {label}
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [movies, setMovies]   = useState([]);
  const [shows, setShows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Hindi", "English", "Tamil", "Telugu", "2D", "3D", "4D"];

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
    toast("Please login to book tickets 🔐");
    navigate("/login", { state: { redirect: `/shows/${showId}` } });
  };

  const upcomingShows = shows.filter((s) => new Date(s.rawStartTime) > new Date());

  const getShowCount = (movieId) =>
    shows.filter((s) => s.movie?.id === movieId).length;

  const filteredMovies = movies.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      m.title.toLowerCase().includes(q) ||
      m.genre?.toLowerCase().includes(q) ||
      m.language?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (activeFilter === "All") return true;
    const langFilters = ["Hindi", "English", "Tamil", "Telugu"];
    const typeFilters = ["2D", "3D", "4D"];
    if (langFilters.includes(activeFilter))
      return m.language?.toLowerCase().includes(activeFilter.toLowerCase());
    if (typeFilters.includes(activeFilter))
      return shows.some((s) => s.movie?.id === m.id && s.showType === activeFilter);
    return true;
  });

  const filteredShows = upcomingShows.filter((s) =>
    s.movie?.title.toLowerCase().includes(search.toLowerCase()) ||
    s.theatre?.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSearching = search.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0" style={{ fontFamily: FONT_BODY }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center gap-3 md:gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 no-underline">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film size={15} className="text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight" style={{ fontFamily: FONT_HEADING }}>
              Cine<span className="text-primary">Book</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-sm md:max-w-md relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 rounded-full pl-9 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white border-2 border-transparent focus:border-primary/30 transition placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Auth buttons */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition no-underline"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 md:px-5 py-2 rounded-full transition no-underline"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      {!loading && !isSearching && movies.length > 0 && (
        <HeroCarousel movies={movies} shows={shows} onBook={handleBookNow} />
      )}

      {/* ── Mobile subheader ── */}
      {!isSearching && (
        <div className="md:hidden bg-white px-4 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: FONT_HEADING }}>It All Starts Here!</h2>
          <p className="text-gray-400 text-xs mt-0.5">Mumbai, Maharashtra</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">

        {/* ── Search results ── */}
        {isSearching && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_HEADING }}>
              Results for &ldquo;{search}&rdquo;
            </h2>
            {filteredMovies.length === 0 && filteredShows.length === 0 ? (
              <div className="text-center py-16">
                <Film size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No results found</p>
              </div>
            ) : (
              <>
                {filteredMovies.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-500 mb-3">Movies</p>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-5 lg:grid-cols-6 md:overflow-visible md:pb-0">
                      {filteredMovies.map((movie) => (
                        <MovieCard
                          key={movie.id} movie={movie}
                          showCount={getShowCount(movie.id)}
                          onClick={() => handleBookNow(shows.find(s => s.movie?.id === movie.id)?.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {filteredShows.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-3">Shows</p>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                      {filteredShows.map((show) => (
                        <ShowCard key={show.id} show={show} onClick={() => handleBookNow(show.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Now Showing ── */}
        {!isSearching && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: FONT_HEADING }}>Now Showing</h2>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 md:flex-wrap md:overflow-visible md:pb-0">
                {filters.map((f) => (
                  <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i}>
                    <div className="w-full aspect-[2/3] rounded-xl bg-gray-200 animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-1" />
                    <div className="h-2.5 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="text-center py-16">
                <Film size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium mb-4">No movies found</p>
                <button
                  onClick={() => { setSearch(""); setActiveFilter("All"); }}
                  className="border border-gray-200 text-gray-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-5">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id} movie={movie}
                    showCount={getShowCount(movie.id)}
                    onClick={() => handleBookNow(shows.find(s => s.movie?.id === movie.id)?.id)}
                  />
                ))}
              </div>
            )}

            {/* ── Upcoming Shows ── */}
            {!loading && upcomingShows.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: FONT_HEADING }}>Upcoming Shows</h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                  {upcomingShows.slice(0, 6).map((show) => (
                    <ShowCard key={show.id} show={show} onClick={() => handleBookNow(show.id)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 px-4 md:px-10 py-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Film size={13} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm" style={{ fontFamily: FONT_HEADING }}>
              Cine<span className="text-primary">Book</span>
            </span>
          </div>
          <p className="text-gray-400 text-xs">© 2026 CineBook · Made by Svayam Shanishwara</p>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms of Use", "Contact"].map((item) => (
              <a key={item} href="#" className="text-gray-400 hover:text-gray-700 text-xs font-medium transition no-underline">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;