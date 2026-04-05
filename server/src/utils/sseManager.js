import logger from "../config/logger.js";

const showConnections = new Map();

export const addConnection = (showId, res) => {
  const id = parseInt(showId);  // ✅ always number
  if (!showConnections.has(id)) {
    showConnections.set(id, new Set());
  }
  showConnections.get(id).add(res);
  logger.info(`SSE addConnection: showId=${id} totalConnections=${showConnections.get(id).size}`);
};

export const removeConnection = (showId, res) => {
  const id = parseInt(showId);  // ✅ always number
  const connections = showConnections.get(id);
  if (!connections) return;
  connections.delete(res);
  if (connections.size === 0) {
    showConnections.delete(id);
  }
};

export const broadcastToShow = (showId, data) => {
  const id = parseInt(showId);  // ✅ always number
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