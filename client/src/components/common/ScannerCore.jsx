import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import jsQR from "jsqr";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ScanLine, CheckCircle2, XCircle, AlertTriangle,
  Camera, MapPin, Clock, User, Mail, CreditCard,
  Calendar, Hash, Download
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// ─── PDF Download ─────────────────────────────────────────────────────────────
const downloadTicketPDF = async (ticketRef, bookingId) => {
  if (!ticketRef.current) return;
  try {
    toast.loading("Generating PDF...", { id: "pdf" });
    const canvas = await html2canvas(ticketRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`CineBook-Ticket-${bookingId}.pdf`);
    toast.success("Ticket downloaded!", { id: "pdf" });
  } catch {
    toast.error("Failed to generate PDF", { id: "pdf" });
  }
};

// ─── Result Display ───────────────────────────────────────────────────────────
const ResultCard = ({ result, onConfirm, onReset, confirming, isAdmin }) => {
  const ticketRef = useRef(null);
  if (!result) return null;

  const { valid, reason, message, booking, usedAt, entryOpenTime } = result;

  if (reason === "ALREADY_USED") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-red-500 font-heading text-xl font-bold mb-1">Already Used</h2>
          <p className="text-gray-500 text-sm mb-2">{message}</p>
          <p className="text-gray-400 text-xs">Used at: {usedAt}</p>
          {booking && (
            <div className="mt-4 text-left bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-gray-900 text-sm font-medium">{booking.show?.movie}</p>
              <p className="text-gray-400 text-xs">{booking.user?.name} {booking.user?.surname}</p>
            </div>
          )}
        </div>
        <button onClick={onReset} className="w-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 py-3 rounded-2xl text-sm transition">
          Scan Another Ticket
        </button>
      </div>
    );
  }

  if (reason === "TOO_EARLY") {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
          <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-3" />
          <h2 className="text-yellow-600 font-heading text-xl font-bold mb-1">Too Early</h2>
          <p className="text-gray-500 text-sm mb-1">{message}</p>
          <p className="text-gray-400 text-xs">Entry opens: {entryOpenTime}</p>
          {booking && (
            <div className="mt-4 text-left bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-gray-900 text-sm font-medium">{booking.show?.movie}</p>
              <p className="text-gray-400 text-xs">{booking.user?.name} {booking.user?.surname}</p>
              <p className="text-gray-400 text-xs">{booking.show?.theatre}</p>
              <p className="text-gray-400 text-xs">{booking.show?.startTime}</p>
            </div>
          )}
        </div>
        <button onClick={onReset} className="w-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 py-3 rounded-2xl text-sm transition">
          Scan Another Ticket
        </button>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-red-500 font-heading text-xl font-bold mb-1">Invalid Ticket</h2>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
        <button onClick={onReset} className="w-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 py-3 rounded-2xl text-sm transition">
          Scan Another Ticket
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={28} className="text-green-500 flex-shrink-0" />
        <div>
          <p className="text-green-600 font-semibold">Valid Ticket</p>
          <p className="text-gray-400 text-xs">Review all details carefully before marking as used</p>
        </div>
      </div>

      {/* ✅ Printable/downloadable ticket area */}
      <div ref={ticketRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* LEFT */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Customer</p>
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-primary flex-shrink-0" />
                <span className="text-gray-900 font-medium">
                  {booking.user?.name} {booking.user?.surname}
                </span>
                <span className="text-gray-400 text-xs">@{booking.user?.username}</span>
              </div>
              {booking.user?.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-primary flex-shrink-0" />
                  <span className="text-gray-500">{booking.user.email}</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Show</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} className="text-primary flex-shrink-0" />
                <span>{booking.show?.theatre}{booking.show?.location ? `, ${booking.show.location}` : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={13} className="text-primary flex-shrink-0" />
                <span>{booking.show?.startTime}</span>
              </div>
              <div className="flex gap-2 flex-wrap mt-1">
                {booking.show?.showType && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {booking.show.showType}
                  </span>
                )}
                {booking.show?.movieRating && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {booking.show.movieRating}
                  </span>
                )}
                {booking.show?.movieLanguage && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {booking.show.movieLanguage}
                  </span>
                )}
                {booking.show?.movieDuration && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {booking.show.movieDuration} min
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium mb-3">
                Seats ({booking.seats?.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(booking.seats) && booking.seats.map((seat, i) => (
                  <div
                    key={i}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex flex-col items-center
                      ${seat.type === "GOLDEN"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                  >
                    <span>{seat.row}{seat.number}</span>
                    <span className="text-[9px] opacity-60 mt-0.5">
                      {seat.type === "GOLDEN" ? "✦ Golden" : "Regular"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Payment</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm flex items-center gap-1.5">
                  <CreditCard size={13} className="text-primary" />
                  Total Paid
                </span>
                <span className="text-gray-900 font-bold text-lg">₹{booking.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Type</span>
                <span className="text-gray-700 text-sm">{booking.paymentType}</span>
              </div>
              {booking.paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Payment ID</span>
                  <span className="text-gray-500 text-xs font-mono truncate max-w-[160px]">
                    {booking.paymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-3">
            {booking.show?.moviePoster ? (
              <div className="relative rounded-2xl overflow-hidden h-52">
                <img
                  src={booking.show.moviePoster}
                  alt={booking.show.movie}
                  className="w-full h-full object-cover object-top"
                  style={{ filter: "brightness(0.45)" }}
                />
                <div className="absolute inset-0 flex items-end p-4">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-white leading-tight">
                      {booking.show?.movie}
                    </h2>
                    {booking.show?.movieGenre && (
                      <p className="text-zinc-300 text-xs mt-1">{booking.show.movieGenre}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <h2 className="font-heading text-xl font-bold text-gray-900">{booking.show?.movie}</h2>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-medium">Booking Info</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm flex items-center gap-1.5">
                  <Hash size={13} className="text-primary" />
                  Booking ID
                </span>
                <span className="text-gray-900 text-sm font-mono">#{booking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary" />
                  Booked On
                </span>
                <span className="text-gray-700 text-sm">{booking.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Action buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-2xl text-base transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {confirming ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Marking as used...
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Mark as Used
            </>
          )}
        </button>

        {/* ✅ Download PDF — admin only */}
        {isAdmin && (
          <button
            onClick={() => downloadTicketPDF(ticketRef, booking.id)}
            className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-semibold py-3 rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download Ticket PDF
          </button>
        )}

        <button
          onClick={onReset}
          className="w-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 py-3 rounded-2xl text-sm transition flex items-center justify-center gap-2"
        >
          <Camera size={16} />
          Scan Another Ticket
        </button>
      </div>
    </div>
  );
};

// ─── Scanner Core ─────────────────────────────────────────────────────────────
const ScannerCore = ({ isAdmin = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const scannedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        scannedRef.current = false;
        scanLoop();
      }
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setCameraActive(false);
  };

  const scanLoop = () => {
    if (scannedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      scannedRef.current = true;
      stopCamera();
      handleQRData(code.data);
      return;
    }
    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const handleQRData = async (qrData) => {
    const parts = qrData.split("-");
    if (parts.length < 3 || parts[0] !== "CINEBOOK") {
      setResult({ valid: false, reason: "INVALID_FORMAT", message: "Invalid QR code format. Not a CineBook ticket." });
      return;
    }
    const bookingId = parseInt(parts[1]);
    if (isNaN(bookingId)) {
      setResult({ valid: false, reason: "INVALID_FORMAT", message: "Invalid booking ID in QR code." });
      return;
    }
    setCurrentBookingId(bookingId);
    try {
      const res = await fetch(`${API_URL}/bookings/scan/${bookingId}`, { credentials: "include" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, reason: "ERROR", message: "Failed to verify ticket. Check connection." });
    }
  };

  const handleConfirm = async () => {
    if (!currentBookingId) return;
    setConfirming(true);
    try {
      const res = await fetch(`${API_URL}/bookings/scan/${currentBookingId}/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Ticket verified and marked as used! ✅");
        setResult((prev) => ({ ...prev, confirmed: true }));
        setTimeout(() => { handleReset(); }, 3000);
      } else {
        toast.error(data?.message || "Failed to confirm ticket");
      }
    } catch {
      toast.error("Failed to confirm ticket. Check connection.");
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCurrentBookingId(null);
    scannedRef.current = false;
    stopCamera();
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScanLine size={24} className="text-primary" />
          Ticket Scanner
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Scan customer's QR code to verify their ticket
        </p>
      </div>

      {result?.confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center max-w-md mx-auto">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-green-600 font-heading text-2xl font-bold mb-2">Verified!</h2>
          <p className="text-gray-400 text-sm">Ticket marked as used. Resetting scanner...</p>
        </div>
      )}

      {!result && (
        <div className="space-y-4 max-w-md mx-auto">
          <div className="relative bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                <Camera size={48} className="text-gray-300" />
                <p className="text-gray-400 text-sm text-center px-4">
                  {cameraError || "Camera inactive. Press Start Scanning to begin."}
                </p>
              </div>
            )}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-primary/60 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>
          {cameraError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm">{cameraError}</p>
            </div>
          )}
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-2xl text-base transition flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Start Scanning
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 py-4 rounded-2xl text-base transition"
            >
              Stop Camera
            </button>
          )}
        </div>
      )}

      {result && !result.confirmed && (
        <ResultCard
          result={result}
          onConfirm={handleConfirm}
          onReset={handleReset}
          confirming={confirming}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default ScannerCore;