/// <reference types="vite/client" />
import { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Ticket, X, Printer } from "lucide-react";
import Spinner from "../../components/common/Spinner";
import { QRCodeSVG } from "qrcode.react";

// ─── QR Modal ─────────────────────────────────────────────────────────────────
const QRModal = ({ booking, show, onClose }) => {
  const printRef = useRef();
  const qrValue = `CINEBOOK-${booking.id}-${booking.showId}`;

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>CineBook Ticket — Booking #${booking.id}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 40px; }
            .ticket { border: 2px dashed #333; border-radius: 16px; padding: 32px; max-width: 360px; text-align: center; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            p { color: #555; font-size: 14px; margin: 4px 0; }
            .qr { margin: 24px auto; }
            .seats { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 12px 0; }
            .seat { border: 1px solid #333; border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: bold; }
            .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
            .total { font-size: 22px; font-weight: bold; }
            .footer { font-size: 11px; color: #999; margin-top: 16px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-primary" />
            <span className="font-heading font-semibold text-white">Booking Confirmed!</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Ticket Body — printable */}
        <div className="p-5">
          <div ref={printRef}>
            <div className="ticket" style={{ fontFamily: "Arial, sans-serif", textAlign: "center" }}>
              {/* Movie */}
              <h1 className="font-heading text-lg font-bold text-white mb-1">
                {show?.movie?.title}
              </h1>
              <p className="text-muted text-sm">{show?.showType} · {show?.movie?.language}</p>

              {/* Divider */}
              <div className="border-t border-dashed border-border my-4" />

              {/* Details */}
              <div className="space-y-1.5 text-sm text-muted mb-4">
                <p>🏛️ {show?.theatre?.name}, {show?.theatre?.location}</p>
                <p>🕐 {show?.startTime}</p>
                <p>💳 {booking.paymentType} Payment</p>
              </div>

              {/* Seats */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {booking.seats?.map((seat, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                      ${seat.type === "GOLDEN"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                  >
                    {seat.row}{seat.number}
                  </span>
                ))}
              </div>

              {/* Amount */}
              <div className="bg-dark rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
                <span className="text-muted text-sm">Total</span>
                <span className="text-white font-bold text-lg">₹{booking.totalAmount}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-border my-4" />

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-2xl">
                  <QRCodeSVG
                    value={qrValue}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0D0D0D"
                    level="H"
                  />
                </div>
                <p className="text-muted text-xs font-mono tracking-wide">
                  {qrValue}
                </p>
                <p className="text-muted text-xs">Booking #{booking.id} · Show this at entrance</p>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition"
          >
            <Printer size={16} />
            Print Ticket
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2 bg-card border border-border text-muted hover:text-white py-2.5 rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const WindowBooking = () => {
  const [shows, setShows] = useState([]);
  const [seats, setSeats] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [paymentType, setPaymentType] = useState("CASH");
  const [loadingShows, setLoadingShows] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [booking, setBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null); // ✅ QR modal state

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

  // ✅ SSE — real-time seat updates
  useEffect(() => {
    if (!selectedShow) return;

    const apiBase = import.meta.env.VITE_API_URL;
    if (!apiBase) return;

    let eventSource = null;
    let retryTimeout = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      eventSource = new EventSource(
        `${apiBase}/shows/${selectedShow.id}/seat-updates`,
        { withCredentials: false }
      );
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
            setSelectedSeats((prev) => prev.filter((id) => id !== data.seatId));
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
  }, [selectedShow]);

  const handleShowSelect = async (show) => {
    if (new Date(show.rawStartTime) <= new Date()) return;
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
      return [...prev, seat.id];
    });
  };

  const handleBook = async () => {
    if (!selectedShow || selectedSeats.length === 0) {
      toast.error("Select a show and at least one seat");
      return;
    }
    if (new Date(selectedShow.rawStartTime) <= new Date()) {
      toast.error("Show has already started. Booking is not allowed.");
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
      const jobId = res.data.jobId;
      let attempts = 0;
      const maxAttempts = 60;

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await api.get(`/bookings/status-rest/${jobId}`);
          const { status, booking: bookingData, reason } = statusRes.data;

          if (status === "success" && bookingData) {
            clearInterval(pollInterval);
            toast.success("Booking confirmed! 🎉");

            // ✅ Build booking object for QR modal
            // Fetch full booking details to get seats
            try {
              const bookingRes = await api.get(`/admin/bookings?search=${bookingData.id}`);
              const fullBooking = bookingRes.data.bookings?.find(
                (b) => b.id === bookingData.id
              );

              setConfirmedBooking({
                id: bookingData.id,
                showId: selectedShow.id,
                totalAmount: bookingData.totalAmount,
                paymentType,
                seats: fullBooking?.seats?.map((bs) => ({
                  row: bs.showSeat?.row,
                  number: bs.showSeat?.number,
                  type: bs.seatType,
                })) || [],
              });
            } catch {
              // ✅ fallback if fetch fails — still show QR with basic info
              setConfirmedBooking({
                id: bookingData.id,
                showId: selectedShow.id,
                totalAmount: bookingData.totalAmount,
                paymentType,
                seats: [],
              });
            }

            setSelectedSeats([]);

            // ✅ Refresh seats
            try {
              const seatsRes = await api.get(`/shows/${selectedShow.id}/seats`);
              setSeats(seatsRes.data);
            } catch (err) {
              toast.error(err.message);
            }

            setBooking(false);
          } else if (status === "failed") {
            clearInterval(pollInterval);
            toast.error(reason || "Booking failed");
            setBooking(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            toast.error("Booking timed out. Please try again.");
            setBooking(false);
          }
        } catch (err) {
          clearInterval(pollInterval);
          toast.error(err.message);
          setBooking(false);
        }
      }, 1000);
    } catch (err) {
      toast.error(err.message);
      setBooking(false);
    }
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return sum;
    return sum + (seat.type === "GOLDEN"
      ? selectedShow?.goldenPrice || 0
      : selectedShow?.regularPrice || 0);
  }, 0);

  return (
    <AdminLayout>
      {/* ✅ QR Modal */}
      {confirmedBooking && (
        <QRModal
          booking={confirmedBooking}
          show={selectedShow}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

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
              {shows.map((show) => {
                const hasStarted = new Date(show.rawStartTime) <= new Date();
                return (
                  <div
                    key={show.id}
                    onClick={() => handleShowSelect(show)}
                    className={`bg-card border rounded-xl px-4 py-3 transition
                      ${hasStarted
                        ? "border-border opacity-40 cursor-not-allowed"
                        : selectedShow?.id === show.id
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border hover:border-zinc-600 cursor-pointer"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">{show.movie?.title}</p>
                      {hasStarted && (
                        <span className="text-xs text-red-400 font-medium">Started</span>
                      )}
                    </div>
                    <p className="text-muted text-xs mt-0.5">
                      {show.theatre?.name} • {show.showType} • {show.startTime}
                    </p>
                    <p className="text-primary text-xs mt-0.5">₹{show.regularPrice} regular</p>
                  </div>
                );
              })}
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
              <div className="w-full bg-primary/10 border border-primary/20 rounded-lg py-2 text-center text-primary text-xs font-medium mb-6">
                🎬 SCREEN
              </div>

              <div className="space-y-2 mb-6 flex flex-col items-center">
                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="text-muted text-xs w-4">{row}</span>
                    <div className="flex gap-1 md:gap-1.5">
                      {rowSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          disabled={seat.status !== "AVAILABLE"}
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium transition
                            ${seat.status === "BOOKED"
                              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                              : seat.status === "LOCKED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed"
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
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-zinc-800 inline-block" />Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-primary inline-block" />Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-golden/10 border border-golden/30 inline-block" />Golden
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-zinc-700 inline-block" />Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30 inline-block" />Locked
                </span>
              </div>

              {selectedSeats.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-muted text-sm">{selectedSeats.length} seat(s) selected</p>
                    <p className="text-white font-bold">₹{totalAmount}</p>
                  </div>

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