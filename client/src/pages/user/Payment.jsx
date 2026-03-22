/// <reference types="vite/client" />
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Spinner from "../../components/common/Spinner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Inner payment form component
const PaymentForm = ({ bookingId, totalAmount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Verify payment on server
        await api.post("/payment/verify", {
          paymentIntentId: paymentIntent.id,
          bookingId,
        });
        toast.success("Payment successful! 🎉");
        onSuccess();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm mt-2"
      >
        {processing ? <Spinner text="Processing payment..." /> : `Pay ₹${totalAmount}`}
      </button>
    </form>
  );
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId, showId, selectedSeats, totalAmount, show } = location.state || {};

  const [clientSecret, setClientSecret] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [bookingReady, setBookingReady] = useState(false);

  // Redirect if no state
  useEffect(() => {
    if (!jobId || !showId) navigate("/");
  }, [jobId, showId, navigate]);

  // Wait for booking job to complete via SSE
  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/bookings/status/${jobId}`,
      { withCredentials: true }
    );

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.status === "success") {
        setBookingId(data.booking.id);
        setBookingReady(true);
        eventSource.close();
      } else if (data.status === "failed") {
        toast.error(data.reason || "Booking failed. Please try again.");
        navigate("/");
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      toast.error("Connection error. Please try again.");
      navigate("/");
    };

    return () => eventSource.close();
  }, [jobId, navigate]);

  // Create payment intent once booking is ready
  useEffect(() => {
    if (!bookingReady || !bookingId) return;

    const createIntent = async () => {
      try {
        const res = await api.post("/payment/create-order", { bookingId });
        setClientSecret(res.data.clientSecret);
        setExpiresAt(res.data.expiresAt);
      } catch (err) {
        toast.error(err.message);
        navigate("/");
      } finally {
        setLoadingIntent(false);
      }
    };
    createIntent().catch(console.error);
  }, [bookingReady, bookingId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(interval);
        toast.error("Seat reservation expired. Please try again.");
        navigate("/");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSuccess = () => {
    navigate("/booking-confirm", {
      state: { bookingId, show, selectedSeats, totalAmount },
    });
  };

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="font-heading text-2xl font-bold text-white mb-2">Complete Payment</h1>

        {/* Timer */}
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 mb-6 text-sm font-medium ${timeLeft < 60 ? "text-red-400" : "text-golden"}`}>
            ⏱️ Seats reserved for: {formatTime(timeLeft)}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-heading text-lg font-semibold text-white mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Movie</span>
              <span className="text-white">{show?.movie?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Theatre</span>
              <span className="text-white">{show?.theatre?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Seats</span>
              <span className="text-white">{selectedSeats?.length} seat(s)</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="text-white font-semibold">Total</span>
              <span className="text-white font-bold text-lg">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-heading text-lg font-semibold text-white mb-4">Payment Details</h2>

          {loadingIntent || !clientSecret ? (
            <div className="flex items-center justify-center py-8">
              <Spinner text="Setting up payment..." />
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#7C3AED",
                    colorBackground: "#161616",
                    colorText: "#ffffff",
                    colorDanger: "#ef4444",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <PaymentForm
                bookingId={bookingId}
                totalAmount={totalAmount}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}
        </div>

        <p className="text-muted text-xs text-center mt-4">
          🔒 Payments are secured by Stripe
        </p>
      </div>
    </div>
  );
};

export default Payment;