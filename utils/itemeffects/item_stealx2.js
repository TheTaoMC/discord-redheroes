module.exports = {
  execute(handlers) {
    if (handlers.onStealMultiplier) {
      handlers.onStealMultiplier(2); // Increase steal multiplier by 2x
    }
  },
};
