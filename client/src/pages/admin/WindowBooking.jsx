/// <reference types="vite/client" />
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Ticket } from "lucide-react";
import Spinner from "../../components/common/Spinner";

const WindowBooking = () => {
  const [shows, setShows] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentType, setPaymentType] = useState("CASH");
  const [loadingShows, setLoadingShows] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const res = await api.get("/shows");
        setShows(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingShows(false);
      }
    };
    fetchShows().catch(console.error);
  }, []);

  const handleShowSelect = async (show) => {
    setSelectedShow(show);
    setSelectedSeats([]);
    setLoadingSeats(true);
    try {
      const res = await api.get(`/shows/${show.id}/seats`);
      setSeats(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingSeats(false);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelectedSeats((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      if (prev.length >= 10) {
        toast.error("Max 10 seats per booking");
        return prev;
      }
      return [...prev, seat.id];
    });
  };

  const handleBook = async () => {
    if (!selectedShow || selectedSeats.length === 0) {
      toast.error("Select a show and at least one seat");
      return;
    }
    setBooking(true);
    try {
      const res = await api.post("/admin/bookings", {
        showId: selectedShow.id,
        seatIds: selectedSeats,
        paymentType,
      });

      toast.success("Booking queued!");

      // SSE for booking status
      const eventSource = new EventSource(
        `${import.meta.env.VITE_API_URL}/bookings/status/${res.data.jobId}`,
        { withCredentials: true }
      );

      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.status === "success") {
          toast.success("Booking confirmed! 🎉");
          setSelectedSeats([]);
          handleShowSelect(selectedShow);
          eventSource.close();
          setBooking(false);
        } else if (data.status === "failed") {
          toast.error(data.reason || "Booking failed");
          eventSource.close();
          setBooking(false);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setBooking(false);
      };
    } catch (err) {
      toast.error(err.message);
      setBooking(false);
    }
  };

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return sum;
    return sum + (seat.type === "GOLDEN"
      ? (selectedShow?.goldenPrice || 0)
      : (selectedShow?.regularPrice || 0));
  }, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-white">Window Booking</h1>
        <p className="text-muted text-sm mt-1">Book tickets for walk-in customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Show Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-white font-semibold mb-3">Select Show</h2>
          {loadingShows ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {shows.map((show) => (
                <div
                  key={show.id}
                  onClick={() => handleShowSelect(show)}
                  className={`bg-card border rounded-xl px-4 py-3 cursor-pointer transition
                    ${selectedShow?.id === show.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-zinc-600"}`}
                >
                  <p className="text-white text-sm font-medium">{show.movie?.title}</p>
                  <p className="text-muted text-xs mt-0.5">{show.theatre?.name} • {show.showType} • {show.startTime}</p>
                  <p className="text-primary text-xs mt-0.5">₹{show.regularPrice} regular</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seat Selection */}
        <div className="lg:col-span-2">
          {!selectedShow ? (
            <div className="flex items-center justify-center h-64 bg-card border border-border rounded-2xl">
              <div className="text-center">
                <Ticket size={36} className="text-muted mx-auto mb-2" />
                <p className="text-muted">Select a show to see seats</p>
              </div>
            </div>
          ) : loadingSeats ? (
            <div className="flex items-center justify-center h-64 bg-card border border-border rounded-2xl">
              <Spinner text="Loading seats..." />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5">
              {/* Screen */}
              <div className="w-full bg-primary/10 border border-primary/20 rounded-lg py-2 text-center text-primary text-xs font-medium mb-6">
                🎬 SCREEN
              </div>

              {/* Seats */}
              <div className="space-y-2 mb-6">
                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="text-muted text-xs w-4">{row}</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {rowSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          disabled={seat.status !== "AVAILABLE"}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition
                            ${seat.status === "BOOKED"
                              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                              : seat.status === "LOCKED"
                              ? "bg-yellow-500/20 text-yellow-500 cursor-not-allowed"
                              : selectedSeats.includes(seat.id)
                              ? "bg-primary text-white"
                              : seat.type === "GOLDEN"
                              ? "bg-golden/10 text-golden border border-golden/30 hover:bg-golden/20"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            }`}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 text-xs text-muted">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-zinc-800 inline-block" />Available</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-primary inline-block" />Selected</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-golden/10 border border-golden/30 inline-block" />Golden</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-zinc-700 inline-block" />Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-500/20 inline-block" />Locked</span>
              </div>

              {/* Booking Summary */}
              {selectedSeats.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted text-sm">{selectedSeats.length} seat(s) selected</p>
                    <p className="text-white font-bold">₹{totalAmount}</p>
                  </div>

                  {/* Payment Type */}
                  <div className="flex gap-3 mb-4">
                    {["CASH", "CARD"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPaymentType(type)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition border
                          ${paymentType === type
                            ? "bg-primary border-primary text-white"
                            : "bg-dark border-border text-muted hover:text-white"}`}
                      >
                        {type === "CASH" ? "💵 Cash" : "💳 Card"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                  >
                    {booking ? <Spinner text="Processing..." /> : `Confirm Booking — ₹${totalAmount}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default WindowBooking;