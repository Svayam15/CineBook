import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import api from "../../api/axios";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import { ArrowLeft, MapPin, Clock, Timer } from "lucide-react";

const ShowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
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

  // ── SSE real-time seat updates ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) return;

    let eventSource = null;
    let retryTimeout = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      eventSource = new EventSource(`${apiBase}/shows/${id}/seat-updates`, {
        withCredentials: false,
      });
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "connected") return;
          setSeats((prev) =>
            prev.map((seat) =>
              seat.id === data.seatId ? { ...seat, status: data.status } : seat
            )
          );
          if (data.status === "LOCKED" || data.status === "BOOKED") {
            setSelectedSeats((prev) => prev.filter((s) => s.id !== data.seatId));
          }
        } catch { /* ignore */ }
      };
      eventSource.onerror = () => {
        eventSource.close();
        if (!destroyed) retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      destroyed = true;
      clearTimeout(retryTimeout);
      if (eventSource) eventSource.close();
    };
  }, [id]);

  const isShowStarted = show?.rawStartTime
    ? new Date(show.rawStartTime) <= new Date()
    : false;

  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE" || isShowStarted || bookingLoading) return;
    setSelectedSeats((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => {
    const price = seat.type === "GOLDEN" ? show?.goldenPrice : show?.regularPrice;
    return sum + (price || 0);
  }, 0);

  const handleProceed = async () => {
    if (selectedSeats.length === 0) return;
    if (isShowStarted) {
      toast.error("Show has already started. Booking is not allowed.");
      return;
    }
    if (!isAuthenticated) {
      navigate("/login", { state: { redirect: `/shows/${id}` } });
      return;
    }
    try {
      setBookingLoading(true);
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
    } finally {
      setBookingLoading(false);
    }
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(seatsByRow).sort();

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <p className="text-muted text-sm">Loading show details...</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-base">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-32">

      {/* ── Poster hero ── */}
      {show?.movie?.posterUrl && (
        <div className="relative w-full h-48 sm:h-64 overflow-hidden">
          <img
            src={show.movie.posterUrl}
            alt={show.movie.title}
            className="w-full h-full object-cover object-top scale-110 blur-sm brightness-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-surface" />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-xl text-sm font-medium transition hover:bg-white/20"
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Poster thumb + title overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-4">
            <img
              src={show.movie.posterUrl}
              alt={show.movie.title}
              className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-xl border-2 border-white/20 shadow-lg shrink-0"
            />
            <div className="pb-1">
              <h1 className="text-white font-heading font-bold text-lg sm:text-2xl leading-tight">
                {show.movie.title}
              </h1>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-xs bg-primary/80 text-white px-2 py-0.5 rounded-full font-medium">
                  {show.showType}
                </span>
                {show.movie.rating && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {show.movie.rating}
                  </span>
                )}
                {show.movie.language && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {show.movie.language}
                  </span>
                )}
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {show.movie.duration} min
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── No poster fallback header ── */}
      {!show?.movie?.posterUrl && (
        <div className="bg-white border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-heading font-bold text-gray-900 text-lg">{show?.movie?.title}</h1>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ── Show info card ── */}
        <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-muted">
            <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
            <span>{show?.theatre?.name}, {show?.theatre?.location}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock size={14} className="text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide font-semibold">Starts</p>
                <p className="text-gray-900 font-medium text-xs">{show?.startTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Timer size={14} className="text-primary shrink-0" />
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wide font-semibold">Ends</p>
                <p className="text-gray-900 font-medium text-xs">{show?.endTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Show started banner ── */}
        {isShowStarted && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm font-medium text-center">
            ⚠️ This show has already started. Booking is no longer available.
          </div>
        )}

        {/* ── Pricing ── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-border rounded-2xl px-4 py-3">
            <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Regular</p>
            <p className="text-gray-900 font-bold text-lg">₹{show?.regularPrice}</p>
          </div>
          {show?.hasGoldenSeats && (
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold mb-1">Golden ✦</p>
              <p className="text-amber-600 font-bold text-lg">₹{show?.goldenPrice}</p>
            </div>
          )}
        </div>

        {/* ── Seat map ── */}
        <div className="bg-white border border-border rounded-2xl p-4">

          {/* Screen */}
          <div className="w-full bg-primary/10 border border-primary/20 rounded-lg py-2 text-center text-primary text-xs font-medium mb-6">
            🎬 SCREEN
          </div>

          {/* Seats — same pattern as WindowBooking */}
          <div className="space-y-2 flex flex-col items-center mb-6">
            {rows.map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-4 text-right">{row}</span>
                <div className="flex gap-1 md:gap-1.5">
                  {seatsByRow[row]
                    .sort((a, b) => a.number - b.number)
                    .map((seat) => {
                      const isSelected = selectedSeats.find((s) => s.id === seat.id);
                      const isGolden = seat.type === "GOLDEN";
                      const isBooked = seat.status === "BOOKED";
                      const isLocked = seat.status === "LOCKED";

                      return (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          disabled={isBooked || isLocked || isShowStarted}
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium transition
                            ${isBooked || isShowStarted
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : isLocked
                              ? "bg-red-50 text-red-400 border border-red-200 cursor-not-allowed"
                              : isSelected && isGolden
                              ? "bg-golden text-white scale-110"
                              : isSelected
                              ? "bg-primary text-white scale-110"
                              : isGolden
                              ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                              : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                            }`}
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
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-gray-50 border border-gray-200 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-primary inline-block" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-amber-50 border border-amber-200 inline-block" />
              Golden
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-gray-200 inline-block" />
              Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-red-50 border border-red-200 inline-block" />
              Locked
            </span>
          </div>
        </div>

        {/* ── Description ── */}
        {show?.movie?.description && (
          <div className="bg-white border border-border rounded-2xl p-4">
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">About</p>
            <p className="text-gray-700 text-sm leading-relaxed">{show.movie.description}</p>
          </div>
        )}

      </div>

      {/* ── Bottom bar ── */}
      {selectedSeats.length > 0 && !isShowStarted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-4 py-4 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-900 text-sm font-semibold">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
            </span>
            <span className="text-primary text-xs font-medium">
              {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-900 font-bold text-xl">₹{totalAmount}</span>
            <button
              onClick={handleProceed}
              disabled={bookingLoading}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {bookingLoading ? "Processing..." : "Proceed →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowDetails;