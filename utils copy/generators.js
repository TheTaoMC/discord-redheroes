const words = require("./wordList");

function generateHardMathQuestion() {
  const a = Math.floor(Math.random() * 100) + 50;
  const b = Math.floor(Math.random() * 100) + 50;
  const c = Math.floor(Math.random() * 10) + 1;
  const question = `${a} + ${b} * ${c}`;
  const answer = a + b * c;
  return { question, answer };
}

function generateWordGuessChallenge() {
  const item = words[Math.floor(Math.random() * words.length)];
  return {
    question: `เติมคำให้สมบูรณ์: ${item.hint}\n(แปล: ${item.meaning})`,
    answer: item.word,
  };
}

module.exports = {
  generateHardMathQuestion,
  generateWordGuessChallenge,
};
