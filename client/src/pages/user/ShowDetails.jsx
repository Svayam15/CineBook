import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import api from "../../api/axios";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";

const ShowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

    // ✅ NEW: prevent duplicate bookings
  const [bookingLoading, setBookingLoading] = useState(false);

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchShow = async () => {
      try {
        setLoading(true);
        const [showRes, seatsRes] = await Promise.all([
          axios.get(`/shows/${id}`),
          axios.get(`/shows/${id}/seats`),
        ]);
        setShow(showRes.data);
        setSeats(seatsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load show details");
      } finally {
        setLoading(false);
      }
    };
    fetchShow().catch(console.error);
  }, [id]);

  // Check if show has already started
  const isShowStarted = show?.rawStartTime ? new Date(show.rawStartTime) <= new Date() : false;

  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE") return;
    if (isShowStarted) return;
      if (bookingLoading) return;
    setSelectedSeats((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    const price =
      seat.type === "GOLDEN" ? show?.goldenPrice : show?.regularPrice;
    return sum + (price || 0);
  }, 0);

  const handleProceed = async () => {
    if (selectedSeats.length === 0) return;

    // 🚫 Check if show has already started
    if (isShowStarted) {
      toast.error("Show has already started. Booking is not allowed.");
      return;
    }

    // If not logged in → redirect to login with redirect back
    if (!isAuthenticated) {
      navigate("/login", {
        state: { redirect: `/shows/${id}` },
      });
      return;
    }

    try {

      setBookingLoading(true); // ✅ prevent multiple clicks

      const res = await api.post("/bookings", {
        showId: parseInt(id),
        seatIds: selectedSeats.map((s) => s.id),
      });
      navigate("/payment", {
        state: {
          jobId: res.data.jobId,
          showId: parseInt(id),
          selectedSeats: selectedSeats.map((s) => s.id),
          totalAmount,
          show,
        },
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(seatsByRow).sort();

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading show details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorWrap}>
        <span style={styles.errorIcon}>✕</span>
        <p style={styles.errorText}>{error}</p>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Ambient background */}
      <div style={styles.ambientBg} />

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={styles.headerInfo}>
          <h1 style={styles.movieTitle}>{show?.movie?.title}</h1>
          <div style={styles.badges}>
            <span style={styles.badge}>{show?.showType}</span>
            <span style={styles.badgeDim}>{show?.movie?.duration} min</span>
          </div>
        </div>
      </div>

      {/* Show Info Bar */}
      <div style={styles.infoBar}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>THEATRE</span>
          <span style={styles.infoValue}>{show?.theatre?.name}</span>
        </div>
        <div style={styles.infoDivider} />
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>LOCATION</span>
          <span style={styles.infoValue}>{show?.theatre?.location}</span>
        </div>
        <div style={styles.infoDivider} />
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>STARTS</span>
          <span style={styles.infoValue}>{show?.startTime}</span>
        </div>
        <div style={styles.infoDivider} />
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>ENDS</span>
          <span style={styles.infoValue}>{show?.endTime}</span>
        </div>
      </div>

      {/* Show Started Banner */}
      {isShowStarted && (
        <div style={styles.startedBanner}>
          ⚠️ This show has already started. Booking is no longer available.
        </div>
      )}

      {/* Pricing */}
      <div style={styles.pricingRow}>
        <div style={styles.priceCard}>
          <span style={styles.priceLabel}>REGULAR</span>
          <span style={styles.priceValue}>₹{show?.regularPrice}</span>
        </div>
        {show?.hasGoldenSeats && (
          <div style={{ ...styles.priceCard, ...styles.goldenCard }}>
            <span style={styles.priceLabel}>GOLDEN ✦</span>
            <span style={{ ...styles.priceValue, color: "#f5c842" }}>
              ₹{show?.goldenPrice}
            </span>
          </div>
        )}
      </div>

      {/* Screen */}
      <div style={styles.screenWrap}>
        <div style={styles.screen}>
          <span style={styles.screenText}>SCREEN</span>
        </div>
        <div style={styles.screenGlow} />
      </div>

      {/* Seat Map */}
      <div style={styles.seatMapWrap}>
        {rows.map((row) => (
          <div key={row} style={styles.seatRow}>
            <span style={styles.rowLabel}>{row}</span>
            <div style={styles.seatsInRow}>
              {seatsByRow[row]
                .sort((a, b) => a.number - b.number)
                .map((seat) => {
                  const isSelected = selectedSeats.find((s) => s.id === seat.id);
                  const isGolden = seat.type === "GOLDEN";
                  const isBooked = seat.status === "BOOKED";
                  const isLocked = seat.status === "LOCKED";

                  let seatStyle = { ...styles.seat };
                  if (isShowStarted) seatStyle = { ...seatStyle, ...styles.seatBooked };
                  else if (isBooked) seatStyle = { ...seatStyle, ...styles.seatBooked };
                  else if (isLocked) seatStyle = { ...seatStyle, ...styles.seatLocked };
                  else if (isSelected && isGolden) seatStyle = { ...seatStyle, ...styles.seatSelectedGolden };
                  else if (isSelected) seatStyle = { ...seatStyle, ...styles.seatSelected };
                  else if (isGolden) seatStyle = { ...seatStyle, ...styles.seatGolden };
                  else seatStyle = { ...seatStyle, ...styles.seatAvailable };

                  return (
                    <button
                      key={seat.id}
                      style={seatStyle}
                      onClick={() => toggleSeat(seat)}
                      title={
                        isShowStarted
                          ? "Show has already started"
                          : `${seat.row}${seat.number} — ${seat.type} — ${seat.status}`
                      }
                      disabled={isBooked || isLocked || isShowStarted}
                    >
                      {seat.number}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {[
          { style: styles.seatAvailable, label: "Available" },
          { style: styles.seatGolden, label: "Golden" },
          { style: styles.seatSelected, label: "Selected" },
          { style: styles.seatBooked, label: "Booked" },
          { style: styles.seatLocked, label: "Locked" },
        ].map(({ style, label }) => (
          <div key={label} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, ...style }} />
            <span style={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>

{/* Sticky Bottom Bar — hidden if show has started */}
{selectedSeats.length > 0 && !isShowStarted && (
  <div style={styles.bottomBar}>
    <div style={styles.bottomInfo}>
      <span style={styles.bottomSeats}>
        {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
      </span>
      <span style={styles.bottomSeatNames}>
        {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
      </span>
    </div>

    <div style={styles.bottomRight}>
      <span style={styles.totalAmount}>₹{totalAmount}</span>

      <button
        style={{
          ...styles.proceedBtn,
          opacity: bookingLoading ? 0.7 : 1,
          cursor: bookingLoading ? "not-allowed" : "pointer",
        }}
        onClick={handleProceed}
        disabled={bookingLoading}
      >
        {bookingLoading ? "Processing..." : "Proceed →"}
      </button>
    </div>
  </div>
)}
    </div>
  );
};


const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0a0a0f",
    color: "#e8e8f0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    paddingBottom: "120px",
    position: "relative",
    overflowX: "hidden",
  },
  ambientBg: {
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "300px",
    background: "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0f",
    gap: "16px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid rgba(99,102,241,0.2)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#666",
    fontSize: "14px",
    letterSpacing: "0.05em",
  },
  errorWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0a0f",
    gap: "16px",
  },
  errorIcon: {
    fontSize: "32px",
    color: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "16px",
  },
  header: {
    position: "relative",
    zIndex: 1,
    padding: "32px 40px 24px",
    display: "flex",
    alignItems: "flex-start",
    gap: "24px",
  },
  backBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e8e8f0",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    marginTop: "4px",
    transition: "background 0.2s",
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  movieTitle: {
    fontSize: "clamp(24px, 4vw, 40px)",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    background: "linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  badges: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  badge: {
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.4)",
    color: "#a5b4fc",
    padding: "4px 12px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.08em",
  },
  badgeDim: {
    color: "#555",
    fontSize: "13px",
  },
  infoBar: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: "0",
    margin: "0 40px 32px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  infoItem: {
    flex: "1 1 150px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "16px 24px",
  },
  infoLabel: {
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#555",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: "14px",
    color: "#c8c8d8",
    fontWeight: "500",
  },
  infoDivider: {
    width: "1px",
    background: "rgba(255,255,255,0.06)",
    margin: "12px 0",
  },
  startedBanner: {
    position: "relative",
    zIndex: 1,
    margin: "0 40px 24px",
    padding: "14px 20px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "10px",
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: "0.02em",
  },
  pricingRow: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    gap: "12px",
    padding: "0 40px 32px",
  },
  priceCard: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "14px 24px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "10px",
    minWidth: "120px",
  },
  goldenCard: {
    background: "rgba(245,200,66,0.05)",
    border: "1px solid rgba(245,200,66,0.2)",
  },
  priceLabel: {
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#555",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#e8e8f0",
  },
  screenWrap: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "32px",
    padding: "0 40px",
  },
  screen: {
    width: "min(500px, 80%)",
    height: "6px",
    background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  screenText: {
    position: "absolute",
    top: "-20px",
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "#444",
    fontWeight: "600",
  },
  screenGlow: {
    width: "min(500px, 80%)",
    height: "40px",
    background: "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)",
    borderRadius: "0 0 100px 100px",
  },
  seatMapWrap: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "0 16px",
  },
  seatRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  rowLabel: {
    width: "20px",
    fontSize: "11px",
    color: "#444",
    fontWeight: "600",
    textAlign: "right",
    letterSpacing: "0.05em",
  },
  seatsInRow: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  seat: {
    width: "28px",
    height: "26px",
    borderRadius: "5px 5px 3px 3px",
    border: "none",
    fontSize: "9px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.1s, opacity 0.1s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  seatAvailable: {
    background: "rgba(255,255,255,0.08)",
    color: "#888",
  },
  seatGolden: {
    background: "rgba(245,200,66,0.15)",
    color: "#f5c842",
    border: "1px solid rgba(245,200,66,0.3)",
  },
  seatSelected: {
    background: "#6366f1",
    color: "#fff",
    transform: "scale(1.1)",
  },
  seatSelectedGolden: {
    background: "#f5c842",
    color: "#0a0a0f",
    transform: "scale(1.1)",
  },
  seatBooked: {
    background: "rgba(255,255,255,0.03)",
    color: "#2a2a3a",
    cursor: "not-allowed",
  },
  seatLocked: {
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  legend: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    padding: "24px 40px",
    marginTop: "16px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendDot: {
    width: "20px",
    height: "18px",
    borderRadius: "4px 4px 2px 2px",
  },
  legendLabel: {
    fontSize: "12px",
    color: "#555",
  },
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(10,10,15,0.95)",
    borderTop: "1px solid rgba(99,102,241,0.3)",
    backdropFilter: "blur(20px)",
    padding: "16px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  bottomInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  bottomSeats: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e8e8f0",
  },
  bottomSeatNames: {
    fontSize: "12px",
    color: "#6366f1",
    letterSpacing: "0.05em",
  },
  bottomRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  totalAmount: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#e8e8f0",
  },
  proceedBtn: {
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    border: "none",
    color: "#fff",
    padding: "12px 28px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "opacity 0.2s, transform 0.1s",
  },
};

export default ShowDetails;