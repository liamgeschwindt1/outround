'use strict';

/**
 * Calculate basic audio/speech metrics from a text transcript.
 * Used when AssemblyAI is not available or audio is not accessible.
 *
 * @param {Array} transcript - [{speaker, text, start_ms}]
 * @param {number} durationSeconds - total call duration
 * @returns {Object} audioMetrics
 */
function calculateMetricsFromTranscript(transcript, durationSeconds) {
  const repTurns = transcript.filter((t) => t.speaker === 'rep');
  const prospectTurns = transcript.filter((t) => t.speaker !== 'rep');

  const countWords = (turns) =>
    turns.reduce((acc, t) => acc + (t.text || '').split(/\s+/).filter(Boolean).length, 0);

  const repWords = countWords(repTurns);
  const prospectWords = countWords(prospectTurns);
  const totalWords = repWords + prospectWords;

  const talkRatioRep = totalWords > 0 ? Math.round((repWords / totalWords) * 100) : 50;
  const talkRatioProspect = 100 - talkRatioRep;

  // Estimate WPM from rep word count and speaking time
  const repSpeakingSeconds = durationSeconds > 0 ? durationSeconds * (talkRatioRep / 100) : 60;
  const wpm = repSpeakingSeconds > 0 ? Math.round(repWords / (repSpeakingSeconds / 60)) : 0;

  // Common filler words
  const fillerPattern =
    /\b(um+|uh+|like|you know|basically|literally|actually|so+|right|yeah|okay|er+|hmm+)\b/gi;
  const fillerWords = repTurns.reduce((acc, t) => {
    const matches = (t.text || '').match(fillerPattern);
    return acc + (matches ? matches.length : 0);
  }, 0);

  // Longest rep monologue in seconds (estimate from word count)
  let longestMonologueSeconds = 0;
  if (wpm > 0) {
    repTurns.forEach((t) => {
      const words = (t.text || '').split(/\s+/).filter(Boolean).length;
      const secs = Math.round(words / (wpm / 60));
      if (secs > longestMonologueSeconds) longestMonologueSeconds = secs;
    });
  }

  // Average response latency — approximate from start_ms gaps when available
  let avgLatency = 1.5;
  const turns = transcript.filter((t) => t.start_ms > 0);
  if (turns.length >= 2) {
    let latencies = [];
    for (let i = 1; i < turns.length; i++) {
      const gap = (turns[i].start_ms - turns[i - 1].start_ms) / 1000;
      if (gap > 0 && gap < 10) latencies.push(gap);
    }
    if (latencies.length > 0) {
      avgLatency = Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 10) / 10;
    }
  }

  return {
    wpm: wpm || 150,
    talk_ratio: { rep: talkRatioRep, prospect: talkRatioProspect },
    filler_words: fillerWords,
    longest_monologue_seconds: longestMonologueSeconds,
    avg_response_latency_seconds: avgLatency,
  };
}

module.exports = { calculateMetricsFromTranscript };
