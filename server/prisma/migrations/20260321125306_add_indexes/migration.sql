-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_showId_status_idx" ON "Booking"("showId", "status");

-- CreateIndex
CREATE INDEX "OTP_email_type_used_idx" ON "OTP"("email", "type", "used");

-- CreateIndex
CREATE INDEX "ShowSeat_showId_status_idx" ON "ShowSeat"("showId", "status");

-- CreateIndex
CREATE INDEX "ShowSeat_pendingBookingId_idx" ON "ShowSeat"("pendingBookingId");

-- CreateIndex
CREATE INDEX "ShowSeat_lockedAt_idx" ON "ShowSeat"("lockedAt");
