import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Search, X, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

// ─── Theme hook ───────────────────────────────────────────────────────────────
const useTheme = () => {
  const [dark, setDark] = useState(true);
  return { dark, toggle: () => setDark((d) => !d) };
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
const FONT_HEADING = "'Plus Jakarta Sans', sans-serif";
const FONT_BODY    = "'Manrope', sans-serif";

// ─── Rating Badge ─────────────────────────────────────────────────────────────
const RatingBadge = ({ rating }) => {
  if (!rating) return null;
  const colors = {
    U:  { bg: "rgba(34,197,94,0.15)",  text: "#4ade80",  border: "rgba(34,197,94,0.3)"  },
    UA: { bg: "rgba(234,179,8,0.15)",  text: "#facc15",  border: "rgba(234,179,8,0.3)"  },
    A:  { bg: "rgba(239,68,68,0.15)",  text: "#f87171",  border: "rgba(239,68,68,0.3)"  },
    S:  { bg: "rgba(59,130,246,0.15)", text: "#60a5fa",  border: "rgba(59,130,246,0.3)" },
  };
  const c = colors[rating] || colors.U;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "2px 8px", borderRadius: "4px",
      fontSize: "11px", fontWeight: 700,
      letterSpacing: "0.05em", display: "inline-block",
      fontFamily: FONT_HEADING,
    }}>{rating}</span>
  );
};

// ─── Hero Carousel ────────────────────────────────────────────────────────────
const HeroCarousel = ({ movies, shows, onBook, dark }) => {
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
  const textMain  = dark ? "#fff" : "#0a0a0a";
  const textMuted = dark ? "#a0a0a0" : "#555";

  return (
    <div style={{
      position: "relative", width: "100%", overflow: "hidden",
      height: "clamp(420px, 58vh, 600px)",
    }}>
      {/* Blurred bg from poster */}
      <div style={{
        position: "absolute", inset: "-30px",
        backgroundImage: `url(${movie.posterUrl})`,
        backgroundSize: "cover", backgroundPosition: "center top",
        filter: `blur(50px) brightness(${dark ? "0.28" : "0.55"}) saturate(1.6)`,
        transform: "scale(1.15)",
        transition: "background-image 0.6s ease",
      }} />

      {/* Directional gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: dark
          ? "linear-gradient(105deg, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.72) 50%, rgba(8,8,8,0.08) 100%)"
          : "linear-gradient(105deg, rgba(246,246,246,0.98) 0%, rgba(246,246,246,0.75) 50%, rgba(246,246,246,0.05) 100%)",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        maxWidth: "1280px", margin: "0 auto",
        padding: "0 40px", height: "100%",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "48px",
      }}>
        {/* Left */}
        <div style={{ flex: 1, maxWidth: "520px" }}>
          {/* Meta row */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: "10px", marginBottom: "16px", flexWrap: "wrap",
          }}>
            <RatingBadge rating={movie.rating} />
            {movie.language && (
              <span style={{ color: textMuted, fontSize: "14px", fontWeight: 500 }}>
                {movie.language}
              </span>
            )}
            {movie.genre && (
              <>
                <span style={{ color: dark ? "#333" : "#ccc", fontWeight: 300 }}>|</span>
                <span style={{ color: textMuted, fontSize: "14px" }}>{movie.genre}</span>
              </>
            )}
            {movie.duration && (
              <>
                <span style={{ color: dark ? "#333" : "#ccc", fontWeight: 300 }}>|</span>
                <span style={{ color: textMuted, fontSize: "14px" }}>{movie.duration} min</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: FONT_HEADING,
            fontSize: "clamp(28px, 4.5vw, 54px)",
            fontWeight: 800, lineHeight: 1.08,
            color: textMain, marginBottom: "16px",
            letterSpacing: "-0.03em",
          }}>
            {movie.title}
          </h1>

          {/* Description */}
          {movie.description && (
            <p style={{
              color: textMuted,
              fontFamily: FONT_BODY,
              fontSize: "14px", lineHeight: 1.7,
              marginBottom: "32px",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              maxWidth: "420px",
            }}>
              {movie.description}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={() => firstShow && onBook(firstShow.id)}
            style={{
              background: dark ? "#fff" : "#0a0a0a",
              color: dark ? "#0a0a0a" : "#fff",
              border: "none",
              cursor: firstShow ? "pointer" : "default",
              padding: "14px 32px",
              borderRadius: "12px",
              fontFamily: FONT_HEADING,
              fontSize: "15px", fontWeight: 700,
              letterSpacing: "-0.01em",
              transition: "opacity 0.15s, transform 0.15s",
              opacity: firstShow ? 1 : 0.45,
            }}
            onMouseEnter={(e) => { if (firstShow) e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { if (firstShow) e.currentTarget.style.opacity = "1"; }}
          >
            Book now
          </button>
        </div>

        {/* Right — poster */}
        <div style={{
          flexShrink: 0,
          width: "clamp(190px, 21vw, 290px)",
          aspectRatio: "2/3",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: dark
            ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)"
            : "0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)",
        }}>
          <img
            src={movie.posterUrl}
            alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      </div>

      {/* Arrows */}
      {featured.length > 1 && (
        <>
          {[
            { fn: prev, side: "left",  Icon: ChevronLeft  },
            { fn: next, side: "right", Icon: ChevronRight },
          ].map(({ fn, side, Icon }) => (
            <button key={side} onClick={fn} style={{
              position: "absolute", [side]: "20px", top: "50%",
              transform: "translateY(-50%)", zIndex: 3,
              width: "40px", height: "40px", borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >
              <Icon size={18} />
            </button>
          ))}
        </>
      )}

      {/* Dots */}
      {featured.length > 1 && (
        <div style={{
          position: "absolute", bottom: "22px", left: "50%",
          transform: "translateX(-50%)", zIndex: 3,
          display: "flex", gap: "7px", alignItems: "center",
        }}>
          {featured.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? "24px" : "7px",
              height: "7px", borderRadius: "100px",
              background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.35s ease",
            }} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Filter Chip ──────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onClick, dark, border }) => (
  <button onClick={onClick} style={{
    padding: "8px 20px", borderRadius: "100px",
    border: active ? "1.5px solid #7C3AED" : `1.5px solid ${border}`,
    background: active
      ? "rgba(124,58,237,0.12)"
      : dark ? "rgba(255,255,255,0.04)" : "#fff",
    color: active ? "#a78bfa" : dark ? "#71717A" : "#666",
    fontFamily: FONT_BODY,
    fontSize: "13px", fontWeight: active ? 700 : 500,
    cursor: "pointer", transition: "all 0.18s ease",
    whiteSpace: "nowrap", letterSpacing: "-0.01em",
  }}>
    {label}
  </button>
);

// ─── Movie Card ───────────────────────────────────────────────────────────────
const MovieCard = ({ movie, shows, onBook, dark, border }) => {
  const [hovered, setHovered] = useState(false);
  const firstShow = shows.find((s) => s.movie?.id === movie.id);
  const showCount = shows.filter((s) => s.movie?.id === movie.id).length;
  const textMain  = dark ? "#f0f0f0" : "#0a0a0a";
  const textMuted = dark ? "#555" : "#999";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => firstShow && onBook(firstShow.id)}
      style={{
        cursor: showCount > 0 ? "pointer" : "default",
        transform: hovered && showCount > 0 ? "translateY(-8px)" : "translateY(0)",
        transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Poster */}
      <div style={{
        position: "relative",
        aspectRatio: "2/3",
        borderRadius: "14px",
        overflow: "hidden",
        marginBottom: "14px",
        background: dark ? "#1a1a1a" : "#e0e0e0",
        boxShadow: hovered && showCount > 0
          ? `0 24px 56px rgba(0,0,0,${dark ? "0.65" : "0.22"})`
          : `0 4px 16px rgba(0,0,0,${dark ? "0.3" : "0.1"})`,
        transition: "box-shadow 0.28s ease",
      }}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Film size={40} style={{ color: dark ? "#2a2a2a" : "#ccc" }} />
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 52%)",
          opacity: hovered && showCount > 0 ? 1 : 0,
          transition: "opacity 0.22s ease",
          display: "flex", alignItems: "flex-end", padding: "14px",
        }}>
          <span style={{
            background: "#7C3AED", color: "#fff",
            padding: "8px 16px", borderRadius: "9px",
            fontFamily: FONT_HEADING,
            fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.02em",
          }}>Book Now</span>
        </div>

        {/* Show type badge */}
        {firstShow?.showType && (
          <div style={{ position: "absolute", top: "10px", left: "10px" }}>
            <span style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.14)",
              padding: "3px 8px", borderRadius: "6px",
              fontFamily: FONT_HEADING,
              fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.04em",
            }}>{firstShow.showType}</span>
          </div>
        )}

        {/* No shows overlay */}
        {showCount === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(1.5px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              background: "rgba(0,0,0,0.82)", color: "#4a4a4a",
              padding: "6px 12px", borderRadius: "8px",
              fontFamily: FONT_BODY,
              fontSize: "11px", fontWeight: 600,
            }}>No Shows</span>
          </div>
        )}
      </div>

      {/* Text below */}
      <h3 style={{
        fontFamily: FONT_HEADING,
        fontSize: "14px", fontWeight: 700,
        lineHeight: 1.3, color: textMain,
        marginBottom: "6px", letterSpacing: "-0.02em",
        display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {movie.title}
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <RatingBadge rating={movie.rating} />
        {movie.language && (
          <span style={{ fontFamily: FONT_BODY, fontSize: "12px", color: textMuted }}>
            {movie.language}
          </span>
        )}
        {movie.genre && movie.language && (
          <span style={{ fontSize: "12px", color: dark ? "#2a2a2a" : "#d0d0d0" }}>·</span>
        )}
        {movie.genre && (
          <span style={{ fontFamily: FONT_BODY, fontSize: "12px", color: textMuted }}>
            {movie.genre}
          </span>
        )}
      </div>

      {showCount > 0 && (
        <p style={{
          fontFamily: FONT_BODY,
          fontSize: "12px", color: "#7C3AED",
          marginTop: "6px", fontWeight: 700,
        }}>
          {showCount} show{showCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [movies, setMovies]     = useState([]);
  const [shows, setShows]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
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
    toast("Please login to book tickets 🔐", {
      style: {
        background: dark ? "#1a1a1a" : "#fff",
        color: dark ? "#fff" : "#111",
        border: `1px solid ${dark ? "#27272A" : "#e0e0e0"}`,
        fontFamily: FONT_BODY,
        fontSize: "14px",
      },
    });
    navigate("/login", { state: { redirect: `/shows/${showId}` } });
  };

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

  // Theme tokens
  const bg        = dark ? "#0a0a0a" : "#f6f6f6";
  const textMain  = dark ? "#ffffff" : "#0a0a0a";
  const textMuted = dark ? "#6b6b6b" : "#888";
  const border    = dark ? "rgba(255,255,255,0.08)" : "#e8e8e8";
  const navBg     = dark ? "rgba(10,10,10,0.94)" : "rgba(246,246,246,0.95)";
  const sectionBg = dark ? "#0d0d0d" : "#efefef";

  return (
    <div style={{
      minHeight: "100vh", background: bg,
      color: textMain, fontFamily: FONT_BODY,
      transition: "background 0.3s, color 0.3s",
    }}>

      {/* ── Navbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: navBg, backdropFilter: "blur(24px)",
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 40px", height: "62px",
          display: "flex", alignItems: "center", gap: "20px",
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: "34px", height: "34px", background: "#7C3AED",
              borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Film size={16} color="#fff" />
            </div>
            <span style={{
              fontFamily: FONT_HEADING,
              fontSize: "18px", fontWeight: 800,
              color: textMain, letterSpacing: "-0.03em",
            }}>
              Cine<span style={{ color: "#7C3AED" }}>Book</span>
            </span>
          </Link>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: "400px", position: "relative" }}>
            <Search size={14} style={{
              position: "absolute", left: "14px", top: "50%",
              transform: "translateY(-50%)", color: textMuted,
              pointerEvents: "none",
            }} />
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: dark ? "rgba(255,255,255,0.05)" : "#fff",
                border: `1.5px solid ${border}`,
                borderRadius: "100px",
                padding: "9px 38px",
                fontFamily: FONT_BODY,
                fontSize: "13px", fontWeight: 500,
                color: textMain, outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#7C3AED"}
              onBlur={(e) => e.target.style.borderColor = border}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: "14px", top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: "pointer", color: textMuted,
                display: "flex", padding: 0,
              }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Theme toggle */}
            <button onClick={toggle} title={dark ? "Light mode" : "Dark mode"} style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: `1.5px solid ${border}`,
              background: dark ? "rgba(255,255,255,0.05)" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: textMuted,
              transition: "all 0.2s",
            }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <Link to="/login" style={{
              fontFamily: FONT_BODY,
              fontSize: "14px", fontWeight: 600,
              color: textMuted, textDecoration: "none",
              padding: "8px 14px", borderRadius: "8px",
              transition: "color 0.2s", letterSpacing: "-0.01em",
            }}
              onMouseEnter={(e) => e.target.style.color = textMain}
              onMouseLeave={(e) => e.target.style.color = textMuted}
            >Login</Link>

            <Link to="/signup" style={{
              background: "#7C3AED", color: "#fff",
              fontFamily: FONT_HEADING,
              fontSize: "13px", fontWeight: 700,
              padding: "9px 22px", borderRadius: "100px",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              transition: "background 0.2s, transform 0.15s",
            }}
              onMouseEnter={(e) => {
                e.target.style.background = "#5B21B6";
                e.target.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#7C3AED";
                e.target.style.transform = "scale(1)";
              }}
            >Sign Up</Link>
          </div>
        </div>
      </header>

      {/* ── Hero Carousel ── */}
      {!loading && movies.length > 0 && (
        <HeroCarousel movies={movies} shows={shows} onBook={handleBookNow} dark={dark} />
      )}

      {/* ── Grid Section ── */}
      <div style={{ background: sectionBg, borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "36px 40px 72px" }}>

          {/* Section header */}
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{
              fontFamily: FONT_HEADING,
              fontSize: "24px", fontWeight: 800,
              color: textMain, marginBottom: "18px",
              letterSpacing: "-0.03em",
            }}>Only in Theatres</h2>

            {/* Filter chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {filters.map((f) => (
                <FilterChip
                  key={f} label={f}
                  active={activeFilter === f}
                  onClick={() => setActiveFilter(f)}
                  dark={dark} border={border}
                />
              ))}
            </div>
          </div>

          {/* Count line */}
          {!loading && filteredMovies.length > 0 && (
            <p style={{
              fontFamily: FONT_BODY,
              color: textMuted, fontSize: "13px",
              marginBottom: "24px", fontWeight: 500,
            }}>
              {filteredMovies.length} movie{filteredMovies.length !== 1 ? "s" : ""}
              {activeFilter !== "All" ? ` · ${activeFilter}` : ""}
              {search ? ` · "${search}"` : ""}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "32px 20px",
            }}>
              {[...Array(12)].map((_, i) => (
                <div key={i}>
                  <div style={{
                    aspectRatio: "2/3", borderRadius: "14px",
                    background: dark ? "#1a1a1a" : "#e0e0e0",
                    marginBottom: "14px",
                    animation: "pulse 1.6s ease-in-out infinite",
                    animationDelay: `${i * 0.07}s`,
                  }} />
                  <div style={{ height: "14px", borderRadius: "5px", background: dark ? "#1a1a1a" : "#e0e0e0", width: "80%", marginBottom: "8px" }} />
                  <div style={{ height: "12px", borderRadius: "5px", background: dark ? "#1a1a1a" : "#e0e0e0", width: "55%" }} />
                </div>
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Film size={44} style={{ color: textMuted, marginBottom: "14px" }} />
              <p style={{ fontFamily: FONT_HEADING, color: textMuted, fontSize: "16px", fontWeight: 600, marginBottom: "18px" }}>
                No movies found
              </p>
              <button
                onClick={() => { setSearch(""); setActiveFilter("All"); }}
                style={{
                  background: "none", border: `1.5px solid ${border}`,
                  color: textMuted, padding: "9px 20px",
                  borderRadius: "9px", cursor: "pointer",
                  fontFamily: FONT_BODY, fontSize: "13px", fontWeight: 600,
                }}
              >Clear filters</button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "36px 20px",
            }}>
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie} shows={shows}
                  onBook={handleBookNow}
                  dark={dark} border={border}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        background: dark ? "#080808" : "#fff",
        borderTop: `1px solid ${border}`,
        padding: "32px 40px",
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between", gap: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{
              width: "28px", height: "28px", background: "#7C3AED",
              borderRadius: "7px", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Film size={13} color="#fff" />
            </div>
            <span style={{
              fontFamily: FONT_HEADING, fontWeight: 800,
              fontSize: "15px", color: textMain, letterSpacing: "-0.02em",
            }}>
              Cine<span style={{ color: "#7C3AED" }}>Book</span>
            </span>
          </div>

          <p style={{ fontFamily: FONT_BODY, color: textMuted, fontSize: "12px", fontWeight: 500 }}>
            © 2026 CineBook · Made by Svayam Shanishwara
          </p>

          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Use", "Contact"].map((item) => (
              <a key={item} href="#" style={{
                fontFamily: FONT_BODY,
                color: textMuted, fontSize: "13px",
                fontWeight: 500, textDecoration: "none",
                transition: "color 0.2s",
              }}
                onMouseEnter={(e) => e.target.style.color = textMain}
                onMouseLeave={(e) => e.target.style.color = textMuted}
              >{item}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        *{box-sizing:border-box;margin:0;padding:0;}
        input::placeholder{color:#6b6b6b; font-family:${FONT_BODY};}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#27272A;border-radius:3px;}
      `}</style>
    </div>
  );
};

export default LandingPage;