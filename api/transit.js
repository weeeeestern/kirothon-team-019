module.exports = async function handler(req, res) {
  const { handleRequest } = await import('../server/transit.mjs');
  return handleRequest(req, res);
};
