import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Tv, Clock, MapPin, Search, ArrowRight, Star } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const LandingPage = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("shows");

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

  const handleBookNow = (showId) => {
    // Save redirect destination and go to login
    navigate("/login", {
      state: { redirect: `/shows/${showId}` },
    });
  };

  return (
    <div className="min-h-screen bg-dark">

      {/* Navbar */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="text-primary" size={24} />
            <span className="font-heading text-xl font-bold text-white">
              Cine<span className="text-primary">Book</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-muted hover:text-white transition px-4 py-2"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-primary hover:bg-primary-dark text-white text-sm px-4 py-2 rounded-xl transition font-medium"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-dark px-6 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full mb-6">
            <Star size={12} />
            The Ultimate Movie Booking Experience
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Book Your <span className="text-primary">Perfect</span><br />
            Movie Experience
          </h1>
          <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
            Choose from the latest movies and shows. Book your seats instantly. Enjoy the experience.
          </p>

          <div className="flex items-center justify-center gap-3 mb-10">
            <Link
              to="/signup"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 bg-card border border-border text-white hover:border-primary/50 font-medium px-6 py-3 rounded-xl transition"
            >
              Login
            </Link>
          </div>

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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("shows")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition
              ${activeTab === "shows" ? "bg-primary text-white" : "bg-card border border-border text-muted hover:text-white"}`}
          >
            <Tv size={16} />
            Shows ({filteredShows.length})
          </button>
          <button
            onClick={() => setActiveTab("movies")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition
              ${activeTab === "movies" ? "bg-primary text-white" : "bg-card border border-border text-muted hover:text-white"}`}
          >
            <Film size={16} />
            Movies ({filteredMovies.length})
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : activeTab === "shows" ? (

          /* Shows Grid */
          filteredShows.length === 0 ? (
            <div className="text-center py-16">
              <Tv size={40} className="text-muted mx-auto mb-3" />
              <p className="text-muted">No shows available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShows.map((show) => (
                <div
                  key={show.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold font-heading group-hover:text-primary transition">
                      {show.movie?.title}
                    </h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {show.showType}
                    </span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-muted text-sm flex items-center gap-1.5">
                      <MapPin size={13} />
                      {show.theatre?.name}, {show.theatre?.location}
                    </p>
                    <p className="text-muted text-sm flex items-center gap-1.5">
                      <Clock size={13} />
                      {show.startTime}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-white font-semibold">₹{show.regularPrice}</p>
                      {show.hasGoldenSeats && (
                        <p className="text-golden text-xs">Golden: ₹{show.goldenPrice}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleBookNow(show.id)}
                      className="bg-primary hover:bg-primary-dark text-white text-xs px-4 py-2 rounded-xl transition font-medium"
                    >
                      Book Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )

        ) : (

          /* Movies Grid */
          filteredMovies.length === 0 ? (
            <div className="text-center py-16">
              <Film size={40} className="text-muted mx-auto mb-3" />
              <p className="text-muted">No movies available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition group"
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
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="text-primary" size={20} />
            <span className="font-heading font-bold text-white">
              Cine<span className="text-primary">Book</span>
            </span>
          </div>
          <p className="text-muted text-xs text-center">
            © 2026 CineBook. All rights reserved. Made by Svayam Shanishwara
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;