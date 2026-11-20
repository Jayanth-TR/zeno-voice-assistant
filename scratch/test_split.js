function cleanSplit(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*•·]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();
    if (!clean) continue;
    
    // Split by sentence-ending punctuation followed by whitespace and an uppercase letter/quote
    const sentenceChunks = clean.split(/(?<=[.!?])\s+(?=[A-Z0-9"'•])/);
    
    // Re-merge known abbreviations (e.g. / i.e. / vs. / Dr. / Mr. / etc.)
    const merged = [];
    for (let i = 0; i < sentenceChunks.length; i++) {
      let chunk = sentenceChunks[i].trim();
      if (!chunk) continue;
      if (/\b(e\.g|i\.e|vs|etc|dr|mr|mrs|ms)\.$/i.test(chunk) && i + 1 < sentenceChunks.length) {
        sentenceChunks[i + 1] = chunk + ' ' + sentenceChunks[i + 1].trim();
        continue;
      }
      merged.push(chunk);
    }
    result.push(...merged);
  }
  return result;
}

const input3 = '• Customers who return book 4x more often (e.g. 1.8% vs 6.1%).\n• Would you like to see the segment?';
console.log('Result 3:', cleanSplit(input3));
