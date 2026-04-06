/// <reference types="vite/client" />
import { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Ticket, X, Printer, Download, MapPin, Clock } from "lucide-react";
import Spinner from "../../components/common/Spinner";
import { QRCodeSVG } from "qrcode.react";

// ─── QR Modal ─────────────────────────────────────────────────────────────────
const QRModal = ({ booking, show, onClose }) => {
  const ticketRef = useRef();
  const qrRef = useRef(); // ✅ dedicated ref for QR box
  const qrValue = `CINEBOOK-${booking.id}-${booking.showId}`;

  // ✅ Print — grabs QR SVG from qrRef directly
  const handlePrint = () => {
    const qrSvg = qrRef.current?.querySelector("svg")?.outerHTML || "";

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="en">
        <head>
          <title>CineBook Ticket — Booking #${booking.id}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: #fff; display: flex; justify-content: center; padding: 40px; }
            .ticket { border: 2px dashed #333; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%; }
            .title { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
            .subtitle { color: #666; font-size: 13px; margin-bottom: 16px; }
            .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
            .label { color: #888; }
            .value { font-weight: 600; color: #111; }
            .seats { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
            .seat { border: 1px solid #333; border-radius: 8px; padding: 4px 10px; font-size: 12px; font-weight: bold; }
            .seat.golden { border-color: #b8860b; color: #b8860b; }
            .total { font-size: 20px; font-weight: bold; text-align: center; margin: 12px 0; }
            .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 16px; }
            .qr-code { font-size: 10px; color: #999; font-family: monospace; }
            .footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="title">${show?.movie?.title || "Movie"}</div>
            <div class="subtitle">${show?.showType || ""} · ${show?.language || ""}</div>
            <div class="divider"></div>
            <div class="row"><span class="label">Theatre</span><span class="value">${show?.theatre?.name || ""}</span></div>
            <div class="row"><span class="label">Location</span><span class="value">${show?.theatre?.location || ""}</span></div>
            <div class="row"><span class="label">Show Time</span><span class="value">${show?.startTime || ""}</span></div>
            <div class="row"><span class="label">Payment</span><span class="value">${booking.paymentType}</span></div>
            <div class="divider"></div>
            <div class="label" style="font-size:12px;margin-bottom:8px;">SEATS</div>
            <div class="seats">
              ${(booking.seats || []).map(s => `<span class="seat ${s.type === "GOLDEN" ? "golden" : ""}">${s.row}${s.number}</span>`).join("")}
            </div>
            <div class="divider"></div>
            <div class="total">₹${booking.totalAmount}</div>
            <div class="divider"></div>
            <div class="qr-wrap">
              ${qrSvg}
              <div class="qr-code">${qrValue}</div>
              <div class="footer">Booking #${booking.id} · Show this at the entrance</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // ✅ Download — converts SVG → PNG first so html2canvas can capture it
  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      toast.loading("Generating PDF...", { id: "pdf" });

      const svgEl = qrRef.current?.querySelector("svg");
      let qrDataUrl = null;

      if (svgEl) {
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);
        qrDataUrl = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.width || 180;
            c.height = img.height || 180;
            c.getContext("2d").drawImage(img, 0, 0);
            resolve(c.toDataURL("image/png"));
            URL.revokeObjectURL(svgUrl);
          };
          img.src = svgUrl;
        });
      }

      if (qrDataUrl && qrRef.current) {
        const existingSvg = qrRef.current.querySelector("svg");
        const tempImg = document.createElement("img");
        tempImg.src = qrDataUrl;
        tempImg.width = 180;
        tempImg.height = 180;
        existingSvg.replaceWith(tempImg);

        const canvas = await html2canvas(ticketRef.current, {
          backgroundColor: "#0D0D0D",
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        // Restore SVG after capture
        tempImg.replaceWith(existingSvg);

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [canvas.width / 2, canvas.height / 2],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`CineBook-Ticket-${booking.id}.pdf`);
        toast.success("Ticket downloaded!", { id: "pdf" });
      } else {
        throw new Error("QR not ready");
      }
    } catch {
      toast.error("Failed to generate PDF", { id: "pdf" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm md:max-w-2xl shadow-2xl overflow-hidden">

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

        <div className="max-h-[80vh] overflow-y-auto">
          {/* Two column on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0" ref={ticketRef}>

            {/* Left — ticket details */}
            <div className="p-5 space-y-4 md:border-r md:border-border">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  {show?.movie?.title}
                </h3>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {show?.showType}
                  </span>
                  {show?.language && (
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                      {show.language}
                    </span>
                  )}
                  {show?.movie?.rating && (
                    <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                      {show.movie.rating}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-border" />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <MapPin size={13} className="text-primary shrink-0" />
                  <span>{show?.theatre?.name}, {show?.theatre?.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Clock size={13} className="text-primary shrink-0" />
                  <span>{show?.startTime}</span>
                </div>
              </div>

              <div>
                <p className="text-muted text-xs mb-2">Seats</p>
                <div className="flex flex-wrap gap-1.5">
                  {(booking.seats || []).map((seat, i) => (
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
              </div>

              <div className="border-t border-dashed border-border" />

              <div className="flex justify-between items-center bg-dark rounded-xl px-4 py-3">
                <span className="text-muted text-sm">Total Paid</span>
                <span className="text-white font-bold text-lg">₹{booking.totalAmount}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Payment</span>
                <span className="text-white">{booking.paymentType}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Booking ID</span>
                <span className="text-white font-mono">#{booking.id}</span>
              </div>
            </div>

            {/* Right — QR */}
            <div className="p-5 flex flex-col items-center justify-center gap-4 bg-dark/30">
              <div className="border-t border-dashed border-border w-full md:hidden" />
              <p className="text-muted text-xs text-center">Show this QR at the entrance</p>
              {/* ✅ qrRef is here — on the white box wrapping the SVG */}
              <div className="bg-white p-4 rounded-2xl" ref={qrRef}>
                <QRCodeSVG
                  value={qrValue}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0D0D0D"
                  level="H"
                />
              </div>
              <p className="text-muted text-xs font-mono tracking-wide text-center break-all">
                {qrValue}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-5 pt-0 flex flex-col gap-2">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-semibold py-3 rounded-xl transition text-sm"
            >
              <Download size={16} />
              Download Ticket PDF
            </button>
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-card border border-border text-muted hover:text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              <Printer size={16} />
              Print Ticket
            </button>
            <button
              onClick={onClose}
              className="w-full bg-dark border border-border text-muted hover:text-white py-2.5 rounded-xl text-sm transition"
            >
              Close
            </button>
          </div>
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
  const [confirmedBooking, setConfirmedBooking] = useState(null);

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

  // SSE — real-time seat updates
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
              // fallback if fetch fails — still show QR with basic info
              setConfirmedBooking({
                id: bookingData.id,
                showId: selectedShow.id,
                totalAmount: bookingData.totalAmount,
                paymentType,
                seats: [],
              });
            }

            setSelectedSeats([]);

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
      {/* QR Modal */}
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