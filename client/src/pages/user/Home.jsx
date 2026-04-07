import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Film, Clock, MapPin, ChevronRight, Star } from "lucide-react";

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

// ─── Movie Poster Card ────────────────────────────────────────────────────────
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
        <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[movie.rating]}`}>
          {movie.rating}
        </span>
      )}
    </div>
    <h3 className="text-gray-900 font-semibold text-sm line-clamp-1 leading-snug">
      {movie.title}
    </h3>
    <p className="text-gray-400 text-xs mt-0.5">
      {movie.genres?.slice(0, 2).join(", ")}
    </p>
    {showCount > 0 && (
      <p className="text-primary text-xs mt-0.5 font-medium">
        {showCount} show{showCount !== 1 ? "s" : ""}
      </p>
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
          <span className={`absolute top-2 left-3 text-[10px] px-1.5 py-0.5 rounded font-bold ${RATING_COLORS[show.movie.rating]}`}>
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

// ─── Main Component ───────────────────────────────────────────────────────────
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

  const upcomingShows = shows.filter((s) => new Date(s.rawStartTime) > new Date());

  const getAvailableShowCount = (movieId) =>
    shows.filter((s) => s.movie?.id === movieId && new Date(s.rawStartTime) > new Date()).length;

  const featuredMovie = movies.find((m) => getAvailableShowCount(m.id) > 0);

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.genres?.some((g) => g.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredShows = upcomingShows.filter((s) =>
    s.movie?.title.toLowerCase().includes(search.toLowerCase()) ||
    s.theatre?.name.toLowerCase().includes(search.toLowerCase())
  );

  const isSearching = search.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navbar onSearchChange={setSearch} searchValue={search} />

      {/* ── Desktop Hero Banner — District style ── */}
      {!isSearching && featuredMovie && (
        <div className="hidden md:block relative overflow-hidden bg-gray-900 min-h-[400px]">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${featuredMovie.posterUrl})`, filter: "blur(2px) brightness(0.35)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/70 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 py-14 flex items-center gap-16">
            <div className="flex-1 max-w-lg">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {featuredMovie.rating && (
                  <span className="text-xs bg-white/10 text-white/90 px-2.5 py-1 rounded-full border border-white/20 font-medium">
                    {featuredMovie.rating}
                  </span>
                )}
                {featuredMovie.genres?.slice(0, 2).map((g) => (
                  <span key={g} className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">
                    {g}
                  </span>
                ))}
                {featuredMovie.languages?.slice(0, 1).map((l) => (
                  <span key={l} className="text-xs bg-primary/30 text-primary-light px-2.5 py-1 rounded-full">
                    {l}
                  </span>
                ))}
              </div>
              <h1 className="font-heading text-5xl font-bold text-white mb-3 leading-[1.1] tracking-tight">
                {featuredMovie.title}
              </h1>
              {featuredMovie.director && (
                <p className="text-white/50 text-sm mb-2">Directed by {featuredMovie.director}</p>
              )}
              <p className="text-white/60 text-sm mb-8 line-clamp-2 leading-relaxed">
                {featuredMovie.description}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/movies/${featuredMovie.id}`)}
                  className="bg-white text-gray-900 font-bold px-8 py-3 rounded-full text-sm hover:bg-gray-100 transition"
                >
                  Book now
                </button>
                <button
                  onClick={() => navigate(`/movies/${featuredMovie.id}`)}
                  className="border border-white/30 text-white font-medium px-6 py-3 rounded-full text-sm hover:bg-white/10 transition"
                >
                  More info
                </button>
              </div>
            </div>

            <div className="hidden lg:block shrink-0">
              <img
                src={featuredMovie.posterUrl}
                alt={featuredMovie.title}
                className="w-52 h-76 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10"
                style={{ height: "300px" }}
              />
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
            <span className="w-5 h-1 rounded-full bg-white" />
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="w-1 h-1 rounded-full bg-white/40" />
          </div>
        </div>
      )}

      {/* ── Mobile BMS-style subheader ── */}
      {!isSearching && (
        <div className="md:hidden bg-white px-4 pt-4 pb-3 border-b border-gray-100">
          <h2 className="font-heading text-xl font-bold text-gray-900">It All Starts Here!</h2>
          <p className="text-gray-400 text-xs mt-0.5">Mumbai, Maharashtra</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">

        {/* ── Search results ── */}
        {isSearching && (
          <div className="mb-6">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
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
                          key={movie.id}
                          movie={movie}
                          showCount={getAvailableShowCount(movie.id)}
                          onClick={() => navigate(`/movies/${movie.id}`)}
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
                        <ShowCard key={show.id} show={show} onClick={() => navigate(`/shows/${show.id}`)} />
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
                <h2 className="font-heading text-lg font-bold text-gray-900">Now Showing</h2>
                <button className="flex items-center gap-0.5 text-primary text-sm font-semibold">
                  See All <ChevronRight size={16} />
                </button>
              </div>

              {loading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-5 lg:grid-cols-6 md:overflow-visible md:pb-0">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="shrink-0 w-36 md:w-auto">
                      <div className="w-full aspect-[2/3] rounded-xl bg-gray-100 animate-pulse mb-2" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4 mb-1" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
                    </div>
                  ))}
                </div>
              ) : movies.length === 0 ? (
                <div className="text-center py-12">
                  <Film size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No movies available</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:overflow-visible md:pb-0">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      showCount={getAvailableShowCount(movie.id)}
                      onClick={() => navigate(`/movies/${movie.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Upcoming Shows ── */}
            {upcomingShows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-bold text-gray-900">Upcoming Shows</h2>
                  <button className="flex items-center gap-0.5 text-primary text-sm font-semibold">
                    See All <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
                  {upcomingShows.slice(0, 6).map((show) => (
                    <ShowCard
                      key={show.id}
                      show={show}
                      onClick={() => navigate(`/shows/${show.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;