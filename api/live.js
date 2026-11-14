module.exports = async function handler(req, res) {
  const { handleLiveRequest } = await import('../server/live.mjs');
  return handleLiveRequest(req, res);
};
