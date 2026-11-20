import React from "react";
import { isGreetingText } from "../constants/appConstants";

export function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function combineDeltas(currentText, delta) {
  if (!currentText) return delta;
  if (!delta) return currentText;

  if (currentText.endsWith(delta)) {
    return currentText;
  }

  const trimmedCurrent = currentText.trimEnd();
  const trimmedDelta = delta.trimStart();
  const currentWords = trimmedCurrent.split(/\s+/);
  const deltaWords = trimmedDelta.split(/\s+/);

  if (currentWords.length > 0 && deltaWords.length > 0) {
    const lastWord = currentWords[currentWords.length - 1].toLowerCase().replace(/[^\w]/g, "");
    const firstDeltaWord = deltaWords[0].toLowerCase().replace(/[^\w]/g, "");
    if (lastWord && lastWord === firstDeltaWord && trimmedDelta.startsWith(deltaWords[0])) {
      const remainderDelta = trimmedDelta.slice(deltaWords[0].length);
      return currentText + remainderDelta;
    }
  }

  return currentText + delta;
}

export function renderFormattedContent(text) {
  if (!text) return "";

  const renderInlineLinks = (raw) => {
    const sanitized = raw
      .replace(/\[([^\]]+)\]\\?\(\[(?:[^\]]+)\]\(([^)]+)\)\)/g, "[$1]($2)")
      .replace(/\[([^\]]+)\]\\?\((https?:\/\/[^\s)\\]+)\\?\)/g, "[$1]($2)")
      .replace(/\[([^\]]+)\]\(\[(https?:\/\/[^\s\]]+)\]\)/g, "[$1]($2)");

    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(sanitized)) !== null) {
      const [fullMatch, anchorText, url] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        elements.push(sanitized.slice(lastIndex, matchIndex));
      }

      elements.push(
        <a
          key={`inline-link-${matchIndex}-${url}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="source-link"
        >
          {anchorText}
        </a>
      );

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < sanitized.length) {
      elements.push(sanitized.slice(lastIndex));
    }

    return elements.length > 0 ? elements : sanitized;
  };

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Extract individual complete sentences across all segments without corrupting decimals (e.g. 1.8%, 6.1%, 4.8%)
  const sentences = [];
  for (const line of lines) {
    // Strip leading bullet dots or numbered prefixes (e.g. "1. ", "• ", "- ") while preserving decimals (e.g. 1.8%, 4.8%)
    const cleanLine = line
      .replace(/^[-*•·]\s*/, "")
      .replace(/^\d+[.)]\s+/, "")
      .trim();
    if (!cleanLine) continue;

    // Split strictly on sentence-ending punctuation followed by whitespace and an uppercase letter / quote / number
    const sentenceChunks = cleanLine.split(/(?<=[.!?])\s+(?=[A-Z0-9"'•])/);

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

  // Don't use bulletins for welcome / greeting messages
  const isGreetingMessage =
    /^\s*(Welcome|Hey!?\s*I am Zeno)/i.test(text.trim()) ||
    isGreetingText(text);

  if (!isGreetingMessage && (sentences.length > 1 || /^[-*•·]\s*/.test(text))) {
    return (
      <ul className="chat-bullets-list">
        {sentences.map((sent, idx) => (
          <li key={idx} className="chat-bullet-item">
            <span className="chat-bullet-dot">•</span>
            <span>{renderInlineLinks(sent)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return renderInlineLinks(text);
}
