// Add this file: src/routes/test_routes.js
// Wire it in app.js (DEV ONLY):
//   if (process.env.NODE_ENV !== "production") {
//     const { default: testRoutes } = await import("./routes/test_routes.js");
//     app.use("/test", testRoutes);
//   }

import express from "express";
import * as bookingService from "../services/booking_service.js";
import { bookingQueue } from "../queues/booking_queue.js";
import prisma from "../utils/prisma.js";
import logger from "../config/logger.js";

const router = express.Router();

// 🧪 CONCURRENCY STRESS TEST
// Fires N simultaneous booking requests for the same seats
// Demonstrates that only 1 booking succeeds — the rest get rejected
//
// Usage: POST /test/concurrency-test
// Body: { showId: 1, seatIds: [1, 2], userIds: [1,2,3,4,5], concurrentRequests: 5 }

router.post("/concurrency-test", async (req, res) => {
  const { showId, seatIds, userIds, concurrentRequests = 5 } = req.body;

  if (!showId || !seatIds || !userIds) {
    return res.status(400).json({ message: "showId, seatIds, userIds required" });
  }

  logger.info(`🧪 Concurrency test: ${concurrentRequests} simultaneous requests for seats ${seatIds}`);

  // Fire N booking requests simultaneously
  const promises = userIds.slice(0, concurrentRequests).map((userId, i) =>
    bookingService
      .createBooking({ userId, showId, seatIds, paymentType: "CASH" })
      .then((result) => ({ userId, status: "queued", jobId: result.jobId }))
      .catch((err) => ({ userId, status: "rejected", reason: err.message }))
  );

  const results = await Promise.allSettled(promises);
  const outcomes = results.map((r) =>
    r.status === "fulfilled" ? r.value : { status: "error", reason: r.reason?.message }
  );

  // Wait 3 seconds for workers to process, then check job results
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const jobResults = await Promise.all(
    outcomes
      .filter((o) => o.jobId)
      .map(async (o) => {
        const job = await bookingQueue.getJob(o.jobId);
        const state = job ? await job.getState() : "not_found";
        return {
          userId: o.userId,
          jobId: o.jobId,
          state,
          failedReason: job?.failedReason ?? null,
        };
      })
  );

  const succeeded = jobResults.filter((j) => j.state === "completed").length;
  const failed = jobResults.filter((j) => j.state === "failed").length;
  const rejected = outcomes.filter((o) => o.status === "rejected").length;

  return res.json({
    message: "Concurrency test complete",
    summary: {
      totalRequests: concurrentRequests,
      queuedSuccessfully: outcomes.filter((o) => o.status === "queued").length,
      rejectedBeforeQueue: rejected,
      workerSucceeded: succeeded,
      workerFailed: failed,
    },
    outcomes,
    jobResults,
    conclusion:
      succeeded === 1
        ? "✅ Concurrency control working — exactly 1 booking succeeded"
        : succeeded === 0
        ? "⚠️ All failed — seats may already be booked or invalid"
        : `⚠️ ${succeeded} bookings succeeded — possible double-booking issue`,
  });
});

// 🧪 QUEUE STATS — shows BullMQ queue health
router.get("/queue-stats", async (req, res) => {
  const [waiting, active, failed, completed, delayed] = await Promise.all([
    bookingQueue.getWaitingCount(),
    bookingQueue.getActiveCount(),
    bookingQueue.getFailedCount(),
    bookingQueue.getCompletedCount(),
    bookingQueue.getDelayedCount(),
  ]);

  return res.json({
    queue: "bookingQueue",
    stats: { waiting, active, failed, completed, delayed },
    healthy: active === 0 && waiting < 100,
  });
});

// 🧪 LOCKED SEATS — shows currently locked seats (useful for debugging)
router.get("/locked-seats", async (req, res) => {
  const locked = await prisma.showSeat.findMany({
    where: { status: "LOCKED" },
    include: { show: { include: { movie: true } } },
    orderBy: { lockedAt: "asc" },
  });

  return res.json({
    count: locked.length,
    seats: locked.map((s) => ({
      id: s.id,
      showId: s.showId,
      movie: s.show.movie.title,
      row: s.row,
      number: s.number,
      lockedAt: s.lockedAt,
      pendingBookingId: s.pendingBookingId,
      minutesLocked: s.lockedAt
        ? Math.round((Date.now() - new Date(s.lockedAt)) / 60000)
        : null,
    })),
  });
});

export default router;