import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Search, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT_HEADING = "'Plus Jakarta Sans', sans-serif";
const FONT_BODY    = "'Manrope', sans-serif";

// ─── Responsive hook ──────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatShowtime = (raw) => {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleString("en-IN", {
      weekday: "short", day: "numeric", month: "short",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return raw;
  }
};

const getRatingColor = (rating) => {
  const map = { U: "#2d6a2d", UA: "#7a5c00", A: "#a02020", S: "#1a4fa0" };
  return map[rating] || "#555";
};

// ─── Horizontal Scroll Row ────────────────────────────────────────────────────
const ScrollRow = ({ children, title, isMobile }) => {
  const ref = useRef(null);
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * (isMobile ? 220 : 320), behavior: "smooth" });
  };

  return (
    <div style={{ marginBottom: isMobile ? "32px" : "44px" }}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        marginBottom: isMobile ? "14px" : "18px",
      }}>
        <h2 style={{
          fontFamily: FONT_HEADING,
          fontSize: isMobile ? "16px" : "20px",
          fontWeight: 800, color: "#111", letterSpacing: "-0.03em",
        }}>{title}</h2>

        {/* Scroll arrows — desktop only */}
        {!isMobile && (
          <div style={{ display: "flex", gap: "6px" }}>
            {[ChevronLeft, ChevronRight].map((Icon, i) => (
              <button key={i} onClick={() => scroll(i === 0 ? -1 : 1)} style={{
                width: "32px", height: "32px", borderRadius: "50%",
                border: "1.5px solid #ddd", background: "#fff",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#555",
              }}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Strip — bleeds to edge on mobile for that peek effect */}
      <div ref={ref} style={{
        display: "flex",
        gap: isMobile ? "12px" : "16px",
        overflowX: "auto",
        paddingBottom: "8px",
        marginLeft:   isMobile ? "-16px" : "0",
        marginRight:  isMobile ? "-16px" : "0",
        paddingLeft:  isMobile ? "16px"  : "0",
        paddingRight: isMobile ? "32px"  : "0",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}>
        {children}
      </div>
    </div>
  );
};

// ─── Show Card ────────────────────────────────────────────────────────────────
const ShowCard = ({ show, onBook, isMobile }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onBook(show.id)}
      style={{
        flexShrink: 0,
        width: isMobile ? "200px" : "260px",
        cursor: "pointer",
        transform: hov && !isMobile ? "translateY(-4px)" : "none",
        transition: "transform 0.22s ease",
      }}
    >
      {/* Image */}
      <div style={{
        width: "100%",
        height: isMobile ? "134px" : "175px",
        borderRadius: isMobile ? "10px" : "14px",
        overflow: "hidden", background: "#e8e2d8",
        marginBottom: isMobile ? "9px" : "12px",
        boxShadow: hov && !isMobile
          ? "0 12px 32px rgba(0,0,0,0.18)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.22s ease",
        position: "relative",
      }}>
        {show.movie?.posterUrl ? (
          <img
            src={show.movie.posterUrl} alt={show.movie?.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Film size={32} style={{ color: "#c5bfb3" }} />
          </div>
        )}
        {show.showType && (
          <span style={{
            position: "absolute", top: "8px", left: "8px",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            color: "#fff", fontSize: "9px", fontWeight: 700,
            letterSpacing: "0.06em", padding: "3px 7px",
            borderRadius: "5px", fontFamily: FONT_HEADING,
          }}>{show.showType}</span>
        )}
      </div>

      <p style={{
        fontFamily: FONT_BODY, fontSize: isMobile ? "11px" : "12px",
        fontWeight: 600, color: "#5a6e2e", marginBottom: "4px",
      }}>
        {formatShowtime(show.startTime)}
      </p>
      <h3 style={{
        fontFamily: FONT_HEADING, fontSize: isMobile ? "13px" : "14px",
        fontWeight: 800, color: "#111", letterSpacing: "-0.02em",
        lineHeight: 1.3, marginBottom: "4px",
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {show.movie?.title}
      </h3>
      <p style={{
        fontFamily: FONT_BODY, fontSize: "12px", color: "#888",
        marginBottom: "4px", whiteSpace: "nowrap",
        overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {show.theatre?.name}{show.theatre?.location ? `, ${show.theatre.location}` : ""}
      </p>
      <p style={{ fontFamily: FONT_BODY, fontSize: "12px", fontWeight: 600, color: "#555" }}>
        ₹{show.regularPrice} onwards
      </p>
    </div>
  );
};

// ─── Movie Card ───────────────────────────────────────────────────────────────
const MovieCard = ({ movie, shows, onBook, isMobile }) => {
  const [hov, setHov] = useState(false);
  const firstShow = shows.find((s) => s.movie?.id === movie.id);
  const showCount = shows.filter((s) => s.movie?.id === movie.id).length;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => firstShow && onBook(firstShow.id)}
      style={{
        flexShrink: 0,
        width: isMobile ? "130px" : "160px",
        cursor: showCount ? "pointer" : "default",
        transform: hov && showCount && !isMobile ? "translateY(-4px)" : "none",
        transition: "transform 0.22s ease",
      }}
    >
      <div style={{
        width: "100%", aspectRatio: "2/3",
        borderRadius: isMobile ? "10px" : "12px",
        overflow: "hidden", background: "#e8e2d8", marginBottom: "9px",
        boxShadow: hov && showCount && !isMobile
          ? "0 12px 32px rgba(0,0,0,0.18)"
          : "0 2px 8px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.22s ease", position: "relative",
      }}>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl} alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Film size={24} style={{ color: "#c5bfb3" }} />
          </div>
        )}
        {movie.rating && (
          <span style={{
            position: "absolute", top: "7px", left: "7px",
            background: "#fff", color: getRatingColor(movie.rating),
            fontSize: "9px", fontWeight: 800, letterSpacing: "0.06em",
            padding: "2px 5px", borderRadius: "4px", fontFamily: FONT_HEADING,
          }}>{movie.rating}</span>
        )}
        {!showCount && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(1px)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              background: "rgba(0,0,0,0.6)", color: "#fff",
              fontSize: "10px", fontWeight: 700, padding: "4px 9px",
              borderRadius: "5px", fontFamily: FONT_BODY,
            }}>No shows</span>
          </div>
        )}
      </div>

      <h3 style={{
        fontFamily: FONT_HEADING, fontSize: isMobile ? "12px" : "13px",
        fontWeight: 800, color: "#111", letterSpacing: "-0.02em",
        lineHeight: 1.3, marginBottom: "3px",
        display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{movie.title}</h3>
      <p style={{ fontFamily: FONT_BODY, fontSize: "11px", color: "#888" }}>
        {[movie.language, movie.genre].filter(Boolean).join(" · ")}
      </p>
      {showCount > 0 && (
        <p style={{
          fontFamily: FONT_BODY, fontSize: "11px",
          fontWeight: 700, color: "#5a6e2e", marginTop: "2px",
        }}>
          {showCount} show{showCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonShowCard = ({ isMobile }) => (
  <div style={{ flexShrink: 0, width: isMobile ? "200px" : "260px" }}>
    <div className="shimmer" style={{
      height: isMobile ? "134px" : "175px",
      borderRadius: isMobile ? "10px" : "14px", marginBottom: "9px",
    }} />
    <div className="shimmer" style={{ height: "11px", width: "55%", marginBottom: "7px" }} />
    <div className="shimmer" style={{ height: "14px", width: "80%", marginBottom: "5px" }} />
    <div className="shimmer" style={{ height: "11px", width: "65%" }} />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [movies, setMovies]         = useState([]);
  const [shows, setShows]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("For you");
  const [searchOpen, setSearchOpen] = useState(false);

  const tabs = ["For you", "Movies", "Events", "Dining"];
  const px   = isMobile ? "16px" : "32px";

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const handleBookNow = useCallback((showId) => {
    navigate("/login", { state: { redirect: `/shows/${showId}` } });
  }, [navigate]);

  const filteredMovies = movies.filter((m) => {
    const q = search.toLowerCase();
    return !q ||
      m.title?.toLowerCase().includes(q) ||
      m.genre?.toLowerCase().includes(q) ||
      m.language?.toLowerCase().includes(q);
  });

  const filteredShows = shows.filter((s) => {
    const q = search.toLowerCase();
    return !q ||
      s.movie?.title?.toLowerCase().includes(q) ||
      s.theatre?.name?.toLowerCase().includes(q) ||
      s.theatre?.location?.toLowerCase().includes(q);
  });

  const premiumShows = filteredShows.filter((s) =>
    ["IMAX", "4DX", "Dolby", "4D"].includes(s.showType)
  );
  const noResults = !loading && filteredShows.length === 0 && filteredMovies.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: FONT_BODY, color: "#111" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #ede8df 25%, #e0d9ce 50%, #ede8df 75%);
          background-size: 1200px 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#fff", borderBottom: "1px solid #e8e2d8",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: `0 ${px}` }}>

          {/* Top bar */}
          <div style={{
            height: isMobile ? "52px" : "60px",
            display: "flex", alignItems: "center",
            gap: isMobile ? "10px" : "16px",
          }}>

            {/* Logo — hide when mobile search is open */}
            {(!isMobile || !searchOpen) && (
              <Link to="/" style={{ textDecoration: "none", flexShrink: 0 }}>
                <span style={{
                  fontFamily: FONT_HEADING,
                  fontSize: isMobile ? "18px" : "20px",
                  fontWeight: 800, color: "#111", letterSpacing: "-0.04em",
                }}>
                  cine<span style={{ color: "#e23744" }}>book</span>
                </span>
              </Link>
            )}

            {/* Location pill — desktop only */}
            {!isMobile && (
              <button style={{
                display: "flex", alignItems: "center", gap: "5px",
                background: "transparent", border: "1px solid #ddd",
                borderRadius: "100px", padding: "6px 12px",
                cursor: "pointer", color: "#444",
                fontFamily: FONT_BODY, fontSize: "13px", fontWeight: 500,
                flexShrink: 0,
              }}>
                <MapPin size={13} style={{ color: "#e23744" }} />
                Mumbai
              </button>
            )}

            {/* Search */}
            {isMobile ? (
              searchOpen ? (
                /* Expanded mobile search bar */
                <div style={{ flex: 1, position: "relative" }}>
                  <Search size={14} style={{
                    position: "absolute", left: "12px", top: "50%",
                    transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none",
                  }} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search movies, theatres..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%", background: "#f5f0e8",
                      border: "1.5px solid #e23744", borderRadius: "100px",
                      padding: "9px 36px 9px 34px",
                      fontFamily: FONT_BODY, fontSize: "14px",
                      fontWeight: 500, color: "#111", outline: "none",
                    }}
                  />
                  <button
                    onClick={() => { setSearch(""); setSearchOpen(false); }}
                    style={{
                      position: "absolute", right: "10px", top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none",
                      cursor: "pointer", color: "#aaa", display: "flex", padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* Search icon only */
                <button
                  onClick={() => setSearchOpen(true)}
                  style={{
                    marginLeft: "auto", background: "none", border: "none",
                    cursor: "pointer", color: "#555",
                    display: "flex", alignItems: "center", padding: "6px",
                  }}
                >
                  <Search size={20} />
                </button>
              )
            ) : (
              /* Desktop search bar */
              <div style={{ flex: 1, maxWidth: "440px", position: "relative" }}>
                <Search size={14} style={{
                  position: "absolute", left: "13px", top: "50%",
                  transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none",
                }} />
                <input
                  type="text"
                  placeholder="Search movies, shows, theatres..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%", background: "#f5f0e8",
                    border: "1.5px solid transparent", borderRadius: "100px",
                    padding: "9px 36px 9px 36px",
                    fontFamily: FONT_BODY, fontSize: "13px", fontWeight: 500,
                    color: "#111", outline: "none",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#e23744";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "transparent";
                    e.target.style.background = "#f5f0e8";
                  }}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "#aaa", display: "flex", padding: 0,
                  }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Auth — hide on mobile when search open */}
            {(!isMobile || !searchOpen) && (
              <div style={{
                marginLeft: isMobile ? "0" : "auto",
                display: "flex", alignItems: "center",
                gap: isMobile ? "6px" : "8px",
              }}>
                {!isMobile && (
                  <Link to="/login" style={{
                    fontFamily: FONT_BODY, fontSize: "14px",
                    fontWeight: 600, color: "#444", textDecoration: "none",
                    padding: "8px 14px",
                  }}>Login</Link>
                )}
                <Link to={isMobile ? "/login" : "/signup"} style={{
                  background: "#e23744", color: "#fff",
                  fontFamily: FONT_HEADING,
                  fontSize: isMobile ? "12px" : "13px", fontWeight: 700,
                  padding: isMobile ? "7px 14px" : "9px 22px",
                  borderRadius: "100px", textDecoration: "none",
                  letterSpacing: "-0.01em", whiteSpace: "nowrap",
                }}>
                  {isMobile ? "Login" : "Sign Up"}
                </Link>
              </div>
            )}
          </div>

          {/* Tab row — scrollable on mobile */}
          <div style={{
            display: "flex", borderTop: "1px solid #f0ebe0",
            overflowX: "auto", scrollbarWidth: "none",
          }}>
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: "transparent", border: "none",
                borderBottom: activeTab === tab ? "2.5px solid #111" : "2.5px solid transparent",
                padding: isMobile ? "10px 14px" : "12px 16px",
                fontFamily: FONT_BODY, fontSize: isMobile ? "13px" : "14px",
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? "#111" : "#888",
                cursor: "pointer", letterSpacing: "-0.01em",
                transition: "color 0.15s", whiteSpace: "nowrap",
                flexShrink: 0, marginBottom: "-1px",
              }}>{tab}</button>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════ MAIN ══════════ */}
      <main style={{
        maxWidth: "1280px", margin: "0 auto",
        padding: isMobile ? "24px 16px 72px" : "36px 32px 80px",
      }}>
        {loading ? (
          <>
            {[0, 1].map((s) => (
              <div key={s} style={{ marginBottom: isMobile ? "32px" : "44px" }}>
                <div className="shimmer" style={{
                  height: "20px", width: "150px",
                  marginBottom: isMobile ? "14px" : "18px",
                }} />
                <div style={{ display: "flex", gap: isMobile ? "12px" : "16px" }}>
                  {[...Array(isMobile ? 2 : 4)].map((_, i) => (
                    <SkeletonShowCard key={i} isMobile={isMobile} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : noResults ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Film size={44} style={{ color: "#c5bfb3", marginBottom: "14px" }} />
            <p style={{
              fontFamily: FONT_HEADING, fontSize: "17px",
              fontWeight: 700, color: "#888", marginBottom: "18px",
            }}>Nothing found</p>
            <button onClick={() => setSearch("")} style={{
              background: "#fff", border: "1.5px solid #ddd",
              color: "#555", padding: "10px 22px", borderRadius: "9px",
              cursor: "pointer", fontFamily: FONT_BODY, fontSize: "13px", fontWeight: 600,
            }}>Clear search</button>
          </div>
        ) : (
          <>
            {filteredShows.length > 0 && (
              <ScrollRow title="Now Showing" isMobile={isMobile}>
                {filteredShows.slice(0, 10).map((show) => (
                  <ShowCard key={show.id} show={show} onBook={handleBookNow} isMobile={isMobile} />
                ))}
              </ScrollRow>
            )}

            {premiumShows.length > 0 && (
              <ScrollRow title="Premium Formats" isMobile={isMobile}>
                {premiumShows.map((show) => (
                  <ShowCard key={show.id} show={show} onBook={handleBookNow} isMobile={isMobile} />
                ))}
              </ScrollRow>
            )}

            {filteredMovies.length > 0 && (
              <ScrollRow title="Movies in Theatres" isMobile={isMobile}>
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id} movie={movie}
                    shows={shows} onBook={handleBookNow}
                    isMobile={isMobile}
                  />
                ))}
              </ScrollRow>
            )}
          </>
        )}
      </main>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{
        background: "#fff", borderTop: "1px solid #e8e2d8",
        padding: isMobile ? "20px 16px" : "28px 32px",
      }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between", gap: "12px",
        }}>
          <span style={{
            fontFamily: FONT_HEADING, fontWeight: 800,
            fontSize: "16px", color: "#111", letterSpacing: "-0.04em",
          }}>
            cine<span style={{ color: "#e23744" }}>book</span>
          </span>
          <p style={{ fontFamily: FONT_BODY, color: "#aaa", fontSize: "12px", fontWeight: 500 }}>
            © 2026 CineBook · Made by Svayam Shanishwara
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy", "Terms", "Contact"].map((item) => (
              <a key={item} href="#" style={{
                fontFamily: FONT_BODY, color: "#888",
                fontSize: "13px", fontWeight: 500, textDecoration: "none",
              }}>{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;