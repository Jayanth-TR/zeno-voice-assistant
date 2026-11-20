import React, { useState, useEffect } from "react";

/**
 * Splits text into individual complete sentences so that every single sentence
 * receives its own dedicated bullet point.
 * Preserves decimal numbers (e.g. 1.8%, 6.1%, ₹2.5L) and common abbreviations (e.g., i.e., vs.).
 */
function extractSentences(text) {
  if (!text || typeof text !== "string") return [];

  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const sentences = [];

  for (const line of lines) {
    // Strip leading bullet dots or numbered prefixes (e.g. "1. ", "• ", "- ") while preserving decimals (e.g. 1.8%, 4.8%)
    const clean = line
      .replace(/^[-*•·]\s*/, "")
      .replace(/^\d+[\.)]\s+/, "")
      .trim();
    if (!clean) continue;

    // Split strictly on sentence-ending punctuation followed by whitespace and an uppercase letter / quote / number
    const sentenceChunks = clean.split(/(?<=[.!?])\s+(?=[A-Z0-9"'•])/);

    // Re-merge known abbreviations (e.g. / i.e. / vs. / Dr. / Mr. / etc.)
    const merged = [];
    for (let i = 0; i < sentenceChunks.length; i++) {
      let chunk = sentenceChunks[i].trim();
      if (!chunk) continue;
      if (
        /\b(e\.g|i\.e|vs|etc|dr|mr|mrs|ms)\.$/i.test(chunk) &&
        i + 1 < sentenceChunks.length
      ) {
        sentenceChunks[i + 1] = chunk + " " + sentenceChunks[i + 1].trim();
        continue;
      }
      merged.push(chunk);
    }
    sentences.push(...merged);
  }

  return sentences.length > 0 ? sentences : [text.trim()];
}

export default function SpeechBubbles3D({
  bubbles = [],
  activeBubbleIndex = 0,
  streamingText = "",
  isPlayingAudio = false,
  isThinking = false,
  isGreeting = false,
  thinkingSteps = [],
  currentThinkingStepIndex = 0,
}) {
  const activeItems = bubbles
    .filter(Boolean)
    .filter((b) => b.text && b.text.trim().length > 0);

  if (activeItems.length === 0 && streamingText && streamingText.trim().length > 0) {
    activeItems.push({
      id: "streaming-bubble",
      text: streamingText.trim(),
      sequence: 0,
      isStreaming: true,
      isActive: true,
    });
  }

  const sortedItems = [...activeItems].sort(
    (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
  );

  // Check if this response is a welcome / greeting message
  const hasWelcomeItem = activeItems.some(
    (item) =>
      Boolean(item.isGreeting) ||
      Boolean(isGreeting) ||
      /^\s*(Welcome|Hey!?\s*I am Zeno)/i.test(item.text || "")
  );

  // Flatten all bubble items into individual points / sentences
  const allPoints = [];
  sortedItems.forEach((item) => {
    const isWelcome =
      hasWelcomeItem ||
      Boolean(item.isGreeting) ||
      Boolean(isGreeting) ||
      /^\s*(Welcome|Hey!?\s*I am Zeno)/i.test(item.text || "");

    const cleanText = (item.text || "").replace(/[*_#`]/g, "").trim();

    if (isWelcome) {
      allPoints.push({
        id: item.id || `welcome-${item.sequence ?? 0}`,
        text: cleanText,
        sequence: item.sequence,
        isActive:
          item.isActive !== undefined
            ? item.isActive
            : isPlayingAudio && activeBubbleIndex === item.sequence,
        isStreaming: item.isStreaming,
        isWelcome: true,
      });
    } else {
      const sentences = extractSentences(cleanText);
      sentences.forEach((sent, sIdx) => {
        allPoints.push({
          id: `${item.id || item.sequence || "pt"}-${sIdx}`,
          text: sent,
          sequence: item.sequence,
          isActive:
            item.isActive !== undefined
              ? item.isActive
              : isPlayingAudio && activeBubbleIndex === item.sequence,
          isStreaming: item.isStreaming && sIdx === sentences.length - 1,
          isWelcome: false,
        });
      });
    }
  });

  // User requirement:
  // "when it is responding it should not show zeno is thinking"
  const isResponding =
    isPlayingAudio ||
    activeItems.length > 0 ||
    allPoints.length > 0 ||
    Boolean(streamingText && streamingText.trim().length > 0);
  const showThinking = Boolean(isThinking) && !isResponding;

  if (activeItems.length === 0 && !showThinking) {
    return null;
  }

  // User requirement:
  // "keep the response text only in the left , show only two points .
  //  for example wehave 4 points , then first we have to display first 2 points and the next two points in the same place ."
  const POINTS_PER_PAGE = 2;
  const totalPageCount = Math.max(1, Math.ceil(allPoints.length / POINTS_PER_PAGE));

  // Determine active point index
  let activeIndex = allPoints.findIndex((pt) => pt.isActive || pt.isStreaming);
  if (activeIndex === -1 && isPlayingAudio) {
    activeIndex = allPoints.findIndex((pt) => (pt.sequence ?? 0) === activeBubbleIndex);
  }

  const [playbackPage, setPlaybackPage] = useState(0);
  const [userSelectedPage, setUserSelectedPage] = useState(null);

  // Auto-advance to next pair of points as speech progresses
  useEffect(() => {
    if (activeIndex >= 0) {
      const page = Math.floor(activeIndex / POINTS_PER_PAGE);
      setPlaybackPage(page);
      setUserSelectedPage(null);
    }
  }, [activeIndex]);

  // Reset pagination on new message / turn
  useEffect(() => {
    if (activeItems.length === 0) {
      setPlaybackPage(0);
      setUserSelectedPage(null);
    }
  }, [activeItems.length]);

  const activePage = userSelectedPage !== null ? userSelectedPage : playbackPage;
  const clampedPage = Math.min(Math.max(0, activePage), totalPageCount - 1);

  const displayedPoints = allPoints.slice(
    clampedPage * POINTS_PER_PAGE,
    clampedPage * POINTS_PER_PAGE + POINTS_PER_PAGE
  );

  return (
    <div className="speech-bubbles-3d-stage" aria-live="polite">
      {/* Top right corner near Zeno's head: Zeno is thinking badge (ONLY when NOT responding) */}
      {showThinking && (
        <div className="zeno-thinking-head-badge animate-fade-in">
          <span className="thinking-pulsing-dot" aria-hidden="true" />
          <span className="thinking-text-label">Zeno is thinking...</span>
        </div>
      )}

      {/* Response Column: Strictly on the Left, showing 2 points at a time in the same place */}
      <div className="response-two-sided-layout">
        {displayedPoints.length > 0 && (
          <div className="response-column response-column-left">
            {displayedPoints.map((pt, idx) => (
              <div
                key={pt.id || `pt-${clampedPage}-${idx}`}
                className={`bubble-row-item ${pt.isActive ? "active-speaking-row" : "completed-speaking-row"} animate-slide-3d`}
              >
                {pt.isWelcome ? (
                  <div className="bubble-welcome-wrapper">
                    <p className="bubble-text bubble-welcome-text">
                      {pt.text}
                      {pt.isStreaming && (
                        <span className="streaming-cursor">▍</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="bubble-bullet-row">
                    <span className="bubble-bullet-dot" aria-hidden="true">•</span>
                    <p className="bubble-text">
                      {pt.text}
                      {pt.isStreaming && (
                        <span className="streaming-cursor">▍</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Subtle pagination dots indicator when total points exceed 2 */}
            {totalPageCount > 1 && (
              <div className="response-pagination-row animate-fade-in">
                {Array.from({ length: totalPageCount }).map((_, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    className={`pagination-dot ${pIdx === clampedPage ? "active" : ""}`}
                    onClick={() => setUserSelectedPage(pIdx)}
                    title={`Show points ${pIdx * POINTS_PER_PAGE + 1}-${Math.min((pIdx + 1) * POINTS_PER_PAGE, allPoints.length)}`}
                    aria-label={`Show points page ${pIdx + 1} of ${totalPageCount}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
