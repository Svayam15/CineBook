// Manages all SSE connections grouped by showId
// showId → Set of response objects

import logger from "../config/logger.js";

const showConnections = new Map();

export const addConnection = (showId, res) => {
  if (!showConnections.has(showId)) {
    showConnections.set(showId, new Set());
  }
  showConnections.get(showId).add(res);
};

export const removeConnection = (showId, res) => {
  const connections = showConnections.get(showId);
  if (!connections) return;
  connections.delete(res);
  if (connections.size === 0) {
    showConnections.delete(showId);
  }
};

export const broadcastToShow = (showId, data) => {
  const connections = showConnections.get(showId);

   // ✅ DEBUG LOG — remove after fixing
  logger.info(`SSE broadcast attempt: showId=${showId} type=${typeof showId} activeConnections=${connections?.size ?? 0} totalShows=${showConnections.size}`);


  if (!connections || connections.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of connections) {
    try {
      res.write(payload);
    } catch (err) {
      connections.delete(res);
    }
  }
};