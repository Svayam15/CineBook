import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import api from "../../api/axios";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import Navbar from "../../components/common/Navbar";

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
      setBookingLoading(false);
    }
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const rows = Object.keys(seatsByRow).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted text-sm">Loading show details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-base">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-card border border-border text-muted hover:text-white px-4 py-2 rounded-xl text-sm transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pb-32 md:pb-24">
      <Navbar />

      {/* Header */}
      <div className="px-4 sm:px-10 pt-6 pb-4 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm mt-1 whitespace-nowrap hover:bg-white/10 transition"
        >
          ← Back
        </button>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl sm:text-4xl font-bold text-white leading-tight">
            {show?.movie?.title}
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-primary/20 border border-primary/40 text-primary px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide">
              {show?.showType}
            </span>
            <span className="text-muted text-sm">{show?.movie?.duration} min</span>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="mx-4 sm:mx-10 mb-6 bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden flex flex-wrap">
        {[
          { label: "THEATRE", value: show?.theatre?.name },
          { label: "LOCATION", value: show?.theatre?.location },
          { label: "STARTS", value: show?.startTime },
          { label: "ENDS", value: show?.endTime },
        ].map((item, i) => (
          <div key={i} className="flex-1 min-w-[140px] flex flex-col gap-1 px-5 py-4 border-r border-white/[0.06] last:border-r-0">
            <span className="text-[10px] tracking-widest text-muted font-semibold">{item.label}</span>
            <span className="text-sm text-white/80 font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Show Started Banner */}
      {isShowStarted && (
        <div className="mx-4 sm:mx-10 mb-5 px-5 py-3.5 bg-red-500/8 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
          ⚠️ This show has already started. Booking is no longer available.
        </div>
      )}

      {/* Pricing */}
      <div className="flex gap-3 px-4 sm:px-10 mb-8">
        <div className="flex flex-col gap-1 px-6 py-3.5 bg-white/[0.03] border border-white/[0.07] rounded-xl min-w-[120px]">
          <span className="text-[10px] tracking-widest text-muted font-semibold">REGULAR</span>
          <span className="text-xl font-bold text-white">₹{show?.regularPrice}</span>
        </div>
        {show?.hasGoldenSeats && (
          <div className="flex flex-col gap-1 px-6 py-3.5 bg-golden/5 border border-golden/20 rounded-xl min-w-[120px]">
            <span className="text-[10px] tracking-widest text-muted font-semibold">GOLDEN ✦</span>
            <span className="text-xl font-bold text-golden">₹{show?.goldenPrice}</span>
          </div>
        )}
      </div>

      {/* Screen */}
      <div className="flex flex-col items-center mb-8 px-10">
        <div className="relative w-full max-w-lg">
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] text-muted font-semibold">
            SCREEN
          </span>
          <div className="h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        </div>
        <div className="w-full max-w-lg h-10 bg-gradient-to-b from-primary/8 to-transparent rounded-b-full" />
      </div>

      {/* Seat Map — horizontally scrollable */}
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col items-center gap-1.5 px-4 min-w-max mx-auto">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-right text-[11px] text-muted font-semibold">{row}</span>
              <div className="flex gap-1">
                {seatsByRow[row]
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                    const isSelected = selectedSeats.find((s) => s.id === seat.id);
                    const isGolden = seat.type === "GOLDEN";
                    const isBooked = seat.status === "BOOKED";
                    const isLocked = seat.status === "LOCKED";

                    let cls = "w-7 h-6 rounded-t-md rounded-b-sm text-[9px] font-semibold transition flex items-center justify-center border-none cursor-pointer ";

                    if (isShowStarted || isBooked) {
                      cls += "bg-white/[0.03] text-[#2a2a3a] cursor-not-allowed";
                    } else if (isLocked) {
                      cls += "bg-red-500/10 text-red-400 cursor-not-allowed opacity-50";
                    } else if (isSelected && isGolden) {
                      cls += "bg-golden text-dark scale-110";
                    } else if (isSelected) {
                      cls += "bg-primary text-white scale-110";
                    } else if (isGolden) {
                      cls += "bg-golden/15 text-golden border border-golden/30 hover:bg-golden/25";
                    } else {
                      cls += "bg-white/8 text-muted hover:bg-white/15";
                    }

                    return (
                      <button
                        key={seat.id}
                        className={cls}
                        onClick={() => toggleSeat(seat)}
                        disabled={isBooked || isLocked || isShowStarted}
                        title={`${seat.row}${seat.number} — ${seat.type} — ${seat.status}`}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center px-10 mt-6 mb-4">
        {[
          { cls: "bg-white/8 text-muted", label: "Available" },
          { cls: "bg-golden/15 text-golden border border-golden/30", label: "Golden" },
          { cls: "bg-primary text-white", label: "Selected" },
          { cls: "bg-white/[0.03] text-[#2a2a3a]", label: "Booked" },
          { cls: "bg-red-500/10 text-red-400 opacity-50", label: "Locked" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-5 h-[18px] rounded-t rounded-b-sm ${cls}`} />
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      {selectedSeats.length > 0 && !isShowStarted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark/95 border-t border-primary/30 backdrop-blur-xl px-4 sm:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-white">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
            </span>
            <span className="text-xs text-primary tracking-wide">
              {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-2xl font-bold text-white">₹{totalAmount}</span>
            <button
              onClick={handleProceed}
              disabled={bookingLoading}
              className="bg-primary hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl text-sm font-semibold transition"
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