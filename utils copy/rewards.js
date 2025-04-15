function getDailyReward() {
  const rand = Math.random() * 100;
  if (rand <= 50) return Math.floor(Math.random() * 100) + 1;     // 1-100 (50%)
  if (rand <= 90) return Math.floor(Math.random() * 50) + 101;    // 101-150 (40%)
  if (rand <= 93) return Math.floor(Math.random() * 50) + 151;    // 151-200 (30%)
  if (rand <= 95) return Math.floor(Math.random() * 100) + 201;   // 201-300 (20%)
  if (rand <= 97) return Math.floor(Math.random() * 100) + 301;   // 301-400 (5%)
  if (rand <= 98) return Math.floor(Math.random() * 100) + 401;   // 401-500 (2%)
  if (rand <= 99) return Math.floor(Math.random() * 200) + 501;   // 501-700 (2%)
  return Math.floor(Math.random() * 300) + 701;                   // 701-1000 (1%)
}

function getWorkReward() {
  const rand = Math.random() * 100;
  if (rand <= 50) return Math.floor(Math.random() * 10) + 1;      // 1-10 (50%)
  if (rand <= 70) return Math.floor(Math.random() * 20) + 11;     // 11-30 (20%)
  if (rand <= 85) return Math.floor(Math.random() * 10) + 41;     // 41-50 (15%)
  if (rand <= 95) return Math.floor(Math.random() * 30) + 51;     // 51-80 (10%)
  return Math.floor(Math.random() * 20) + 81;                     // 81-100 (5%)
}

module.exports = {
  getDailyReward,
  getWorkReward
};