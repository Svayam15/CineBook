import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import jsQR from "jsqr";
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Camera, MapPin, Clock, User, Armchair } from "lucide-react";

// ─── Result Display ───────────────────────────────────────────────────────────
const ResultCard = ({ result, onConfirm, onReset, confirming }) => {
  if (!result) return null;

  const { valid, reason, message, booking, usedAt, entryOpenTime } = result;

  // ❌ Already used
  if (reason === "ALREADY_USED") {
    return (
      <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6 text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-red-400 font-heading text-xl font-bold mb-1">Already Used</h2>
        <p className="text-muted text-sm mb-2">{message}</p>
        <p className="text-muted text-xs">Used at: {usedAt}</p>
        {booking && (
          <div className="mt-4 text-left bg-dark rounded-xl p-4 space-y-1">
            <p className="text-white text-sm font-medium">{booking.show?.movie}</p>
            <p className="text-muted text-xs">{booking.user?.name} {booking.user?.surname}</p>
          </div>
        )}
        <button onClick={onReset} className="mt-4 w-full bg-card border border-border text-muted hover:text-white py-2.5 rounded-xl text-sm transition">
          Scan Next Ticket
        </button>
      </div>
    );
  }

  // ⚠️ Too early
  if (reason === "TOO_EARLY") {
    return (
      <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-6 text-center">
        <AlertTriangle size={48} className="text-yellow-400 mx-auto mb-3" />
        <h2 className="text-yellow-400 font-heading text-xl font-bold mb-1">Too Early</h2>
        <p className="text-muted text-sm mb-1">{message}</p>
        <p className="text-muted text-xs">Entry opens: {entryOpenTime}</p>
        <button onClick={onReset} className="mt-4 w-full bg-card border border-border text-muted hover:text-white py-2.5 rounded-xl text-sm transition">
          Scan Next Ticket
        </button>
      </div>
    );
  }

  // ❌ Show ended / not paid / not found
  if (!valid) {
    return (
      <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6 text-center">
        <XCircle size={48} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-red-400 font-heading text-xl font-bold mb-1">Invalid Ticket</h2>
        <p className="text-muted text-sm">{message}</p>
        <button onClick={onReset} className="mt-4 w-full bg-card border border-border text-muted hover:text-white py-2.5 rounded-xl text-sm transition">
          Scan Next Ticket
        </button>
      </div>
    );
  }

  // ✅ Valid — show full details + Mark as Used button
  return (
    <div className="space-y-4">
      {/* Valid banner */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle2 size={28} className="text-green-400 flex-shrink-0" />
        <div>
          <p className="text-green-400 font-semibold">Valid Ticket</p>
          <p className="text-muted text-xs">Review details and mark as used</p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">

        {/* Movie */}
        <div>
          <h2 className="font-heading text-xl font-bold text-white">{booking.show?.movie}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {booking.show?.showType && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {booking.show.showType}
              </span>
            )}
            {booking.show?.movieRating && (
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                {booking.show.movieRating}
              </span>
            )}
            {booking.show?.movieLanguage && (
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                {booking.show.movieLanguage}
              </span>
            )}
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 text-sm">
          <User size={14} className="text-primary flex-shrink-0" />
          <span className="text-white font-medium">
            {booking.user?.name} {booking.user?.surname}
          </span>
          <span className="text-muted">@{booking.user?.username}</span>
        </div>

        {/* Theatre + Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={13} className="text-primary flex-shrink-0" />
            <span>{booking.show?.theatre}, {booking.show?.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock size={13} className="text-primary flex-shrink-0" />
            <span>{booking.show?.startTime}</span>
          </div>
        </div>

        {/* Seats */}
        <div>
          <p className="text-muted text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Armchair size={11} /> Seats
          </p>
          <div className="flex flex-wrap gap-2">
            {booking.seats?.map((seat, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                  ${seat.type === "GOLDEN"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
              >
                {seat.row}{seat.number} {seat.type === "GOLDEN" ? "✦" : ""}
              </span>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-center bg-dark rounded-xl px-4 py-3">
          <span className="text-muted text-sm">Total Paid</span>
          <div className="text-right">
            <span className="text-white font-bold">₹{booking.totalAmount}</span>
            <span className="text-muted text-xs ml-2">{booking.paymentType}</span>
          </div>
        </div>

        {/* Booking ID */}
        <p className="text-muted text-xs text-center">Booking #{booking.id}</p>
      </div>

      {/* Mark as Used button */}
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

      <button onClick={onReset} className="w-full bg-card border border-border text-muted hover:text-white py-3 rounded-2xl text-sm transition">
        Cancel — Scan Different Ticket
      </button>
    </div>
  );
};

// ─── Scanner Core ─────────────────────────────────────────────────────────────
const ScannerCore = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const scannedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // ✅ use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setScanning(true);
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
    setScanning(false);
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
    // Parse: CINEBOOK-{bookingId}-{showId}
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
      const res = await api.get(`/bookings/scan/${bookingId}`);
      setResult(res.data);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        setResult(data);
      } else {
        setResult({ valid: false, reason: "ERROR", message: "Failed to verify ticket. Check connection." });
      }
    }
  };

  const handleConfirm = async () => {
    if (!currentBookingId) return;
    setConfirming(true);
    try {
      await api.post(`/bookings/scan/${currentBookingId}/confirm`);
      toast.success("Ticket verified and marked as used! ✅");
      setResult({
        ...result,
        confirmed: true,
      });
      // Auto reset after 3 seconds
      setTimeout(() => {
        handleReset();
      }, 3000);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to confirm ticket");
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
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
          <ScanLine size={24} className="text-primary" />
          Ticket Scanner
        </h1>
        <p className="text-muted text-sm mt-1">
          Scan customer's QR code to verify their ticket
        </p>
      </div>

      {/* Confirmed state */}
      {result?.confirmed && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
          <CheckCircle2 size={64} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-green-400 font-heading text-2xl font-bold mb-2">Verified!</h2>
          <p className="text-muted text-sm">Ticket marked as used. Resetting scanner...</p>
        </div>
      )}

      {/* Camera / Result */}
      {!result && (
        <div className="space-y-4">
          {/* Camera view */}
          <div className="relative bg-dark border border-border rounded-2xl overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay when camera not active */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark">
                <Camera size={48} className="text-muted" />
                <p className="text-muted text-sm text-center px-4">
                  {cameraError || "Camera inactive. Press Start Scanning to begin."}
                </p>
              </div>
            )}

            {/* Scanning overlay */}
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

          {/* Camera error */}
          {cameraError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{cameraError}</p>
            </div>
          )}

          {/* Controls */}
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
              className="w-full bg-card border border-border text-muted hover:text-white py-4 rounded-2xl text-base transition"
            >
              Stop Camera
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {result && !result.confirmed && (
        <ResultCard
          result={result}
          onConfirm={handleConfirm}
          onReset={handleReset}
          confirming={confirming}
        />
      )}
    </div>
  );
};

export default ScannerCore;