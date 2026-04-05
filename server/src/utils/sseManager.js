// Manages all SSE connections grouped by showId
// showId → Set of response objects

import logger from "../config/logger.js";

const showConnections = new Map();

export const addConnection = (showId, res) => {
  const id = parseInt(showId); // ✅ normalize to number always
  if (!showConnections.has(id)) {
    showConnections.set(id, new Set());
  }
  showConnections.get(id).add(res);
};

export const removeConnection = (showId, res) => {
  const id = parseInt(showId);
  const connections = showConnections.get(id);
  if (!connections) return;
  connections.delete(res);
  if (connections.size === 0) {
    showConnections.delete(id);
  }
};

export const broadcastToShow = (showId, data) => {
  const id = parseInt(showId);
  const connections = showConnections.get(id);
  logger.info(`SSE broadcast: showId=${id} connections=${connections?.size ?? 0}`);
  if (!connections || connections.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of connections) {
    try {
      res.write(payload);
    } catch {
      connections.delete(res);
    }
  }
};