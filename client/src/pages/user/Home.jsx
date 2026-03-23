import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Film, Tv, Clock, MapPin, Search } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("movies");

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

  const filteredShows = shows.filter((s) =>
    s.movie?.title.toLowerCase().includes(search.toLowerCase()) ||
    s.theatre?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-dark px-6 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3">
            Book Your <span className="text-primary">Perfect</span> Movie Experience
          </h1>
          <p className="text-muted text-lg mb-8">
            Choose from the latest movies and shows near you
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search movies or theatres..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-white rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-primary transition text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("movies")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition
              ${activeTab === "movies" ? "bg-primary text-white" : "bg-card border border-border text-muted hover:text-white"}`}
          >
            <Film size={16} />
            Movies ({filteredMovies.length})
          </button>
          <button
            onClick={() => setActiveTab("shows")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition
              ${activeTab === "shows" ? "bg-primary text-white" : "bg-card border border-border text-muted hover:text-white"}`}
          >
            <Tv size={16} />
            Shows ({filteredShows.length})
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : activeTab === "movies" ? (

          /* Movies Grid */
          filteredMovies.length === 0 ? (
            <div className="text-center py-16">
              <Film size={40} className="text-muted mx-auto mb-3" />
              <p className="text-muted">No movies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => setActiveTab("shows")}
                  className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                    <Film size={22} className="text-primary" />
                  </div>
                  <h3 className="text-white font-semibold font-heading mb-1">{movie.title}</h3>
                  <p className="text-muted text-sm flex items-center gap-1">
                    <Clock size={13} />
                    {movie.duration} mins
                  </p>
                  <p className="text-muted text-xs mt-2">
                    {movie.shows?.length || 0} show(s) available
                  </p>
                </div>
              ))}
            </div>
          )

        ) : (

          /* Shows Grid */
          filteredShows.length === 0 ? (
            <div className="text-center py-16">
              <Tv size={40} className="text-muted mx-auto mb-3" />
              <p className="text-muted">No shows found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShows.map((show) => {
                const hasStarted = new Date(show.rawStartTime) <= new Date();

                return (
                  <div
                    key={show.id}
                    onClick={() => !hasStarted && navigate(`/shows/${show.id}`)}
                    className={`bg-card border rounded-2xl p-5 transition group
                      ${hasStarted
                        ? "border-border opacity-60 cursor-not-allowed"
                        : "border-border hover:border-primary/50 cursor-pointer"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`font-semibold font-heading transition
                        ${hasStarted ? "text-zinc-500" : "text-white group-hover:text-primary"}`}>
                        {show.movie?.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {hasStarted && (
                          <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                            Started
                          </span>
                        )}
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {show.showType}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-muted text-sm flex items-center gap-1.5">
                        <MapPin size={13} />
                        {show.theatre?.name}, {show.theatre?.location}
                      </p>
                      <p className="text-muted text-sm flex items-center gap-1.5">
                        <Clock size={13} />
                        {show.startTime}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div>
                        <p className={`font-semibold ${hasStarted ? "text-zinc-500" : "text-white"}`}>
                          ₹{show.regularPrice}
                        </p>
                        {show.hasGoldenSeats && (
                          <p className={`text-xs ${hasStarted ? "text-zinc-600" : "text-golden"}`}>
                            Golden: ₹{show.goldenPrice}
                          </p>
                        )}
                      </div>

                      {hasStarted ? (
                        <button
                          disabled
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.error("Show has already started. Booking is not allowed.");
                          }}
                          className="bg-zinc-800 text-zinc-500 text-xs px-4 py-2 rounded-xl cursor-not-allowed border border-zinc-700"
                        >
                          Show Started
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/shows/${show.id}`);
                          }}
                          className="bg-primary hover:bg-primary-dark text-white text-xs px-4 py-2 rounded-xl transition"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Home;