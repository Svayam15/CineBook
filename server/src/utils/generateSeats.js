export const generateSeats = (totalSeats, goldenSeats = 0) => {
  const seats = [];
  const seatsPerRow = 10;
  const totalRows = Math.ceil(totalSeats / seatsPerRow);
  const goldenRows = Math.ceil(goldenSeats / seatsPerRow);
  const regularRows = totalRows - goldenRows;

  let currentSeat = 1;

  for (let i = 0; i < totalRows; i++) {
    const rowLetter = String.fromCharCode(65 + i); // A, B, C...
    const isGoldenRow = i >= regularRows; // last rows are golden

    for (let j = 1; j <= seatsPerRow; j++) {
      if (currentSeat > totalSeats) break;

      seats.push({
        row: rowLetter,
        number: j,
        type: isGoldenRow ? "GOLDEN" : "REGULAR",
      });

      currentSeat++;
    }
  }

  return seats;
};