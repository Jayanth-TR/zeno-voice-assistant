import re
from typing import List, Optional


class TTSChunker:
    """
    Intelligent sentence-first text chunker for concurrent TTS streaming and UI callout bubbles.
    Accumulates streaming LLM deltas and yields complete, natural sentence chunks.

    Configuration:
      min_words: Minimum words before a sentence boundary can trigger a chunk (default: 3).
      max_words: Maximum words before forcing a chunk if punctuation is missing (default: 35).
      flush_on_sentence: If True, full sentence boundaries (. ! ? \n) flush immediately (default: True).
      sentence_mode: If True, chunks strictly on complete sentences so each UI bubble gets 1 sentence (default: True).
    """

    # Clause / phrase boundary punctuation (fallback if sentence is excessively long)
    CLAUSE_PUNCTUATION = {",", ";", ":", "—", "-", "–"}
    # Sentence ending punctuation
    SENTENCE_PUNCTUATION = {".", "!", "?"}
    # Natural break words (conjunctions, prepositions, relative pronouns)
    BREAK_WORDS = {
        "and", "but", "or", "so", "because", "while",
        "which", "where", "with", "although", "since",
        "as", "such", "including", "especially", "whereas",
    }

    def __init__(
        self,
        min_words: int = 3,
        max_words: int = 40,
        flush_on_sentence: bool = True,
        sentence_mode: bool = True,
    ):
        self.min_words = min_words
        self.max_words = max_words
        self.flush_on_sentence = flush_on_sentence
        self.sentence_mode = sentence_mode
        self.buffer = ""

    def add_delta(self, delta: str) -> List[str]:
        """
        Add an incoming text delta from the LLM stream.
        Returns a list of completed phrase chunks (if any).
        """
        if not delta:
            return []

        self.buffer += delta
        chunks: List[str] = []

        while True:
            chunk = self._extract_next_chunk()
            if not chunk:
                break
            chunks.append(chunk)

        return chunks

    def flush(self) -> List[str]:
        """
        Flush remaining text from buffer when generation finishes.
        """
        remaining = self.buffer.strip()
        self.buffer = ""
        if remaining:
            return [remaining]
        return []

    def reset(self) -> None:
        """Clear the buffer."""
        self.buffer = ""

    def _is_inside_markdown_link(self, text: str, index: int) -> bool:
        """
        Check if the character at `index` is inside a markdown link: [text](url).
        """
        prefix = text[:index]
        open_brackets = len(re.findall(r"(?<!\\)\[", prefix))
        close_brackets = len(re.findall(r"(?<!\\)\]", prefix))
        if open_brackets > close_brackets:
            return True

        last_close_bracket = prefix.rfind("]")
        if last_close_bracket != -1:
            after_bracket = prefix[last_close_bracket:]
            open_parens = after_bracket.count("(")
            close_parens = after_bracket.count(")")
            if open_parens > close_parens:
                return True

        return False

    def _find_split_point(self, text: str) -> Optional[int]:
        """
        Find the optimal character index to split `text` into a phrase chunk.
        Returns None if text is not yet ready to be split.
        """
        # Find all word positions
        words = list(re.finditer(r"\S+", text))
        if not words:
            return None

        # Check whether the text ends with whitespace
        # If no trailing whitespace, the last token might still be incomplete (e.g. "experi" -> "experiences")
        has_trailing_space = bool(re.search(r"\s$", text))
        num_complete_words = len(words) if has_trailing_space else len(words) - 1

        if num_complete_words <= 0:
            return None

        # Scan words to find a suitable phrase boundary
        for i in range(num_complete_words):
            word_idx = i + 1  # 1-based index of completed words
            word_match = words[i]
            word_text = word_match.group(0)
            end_pos = word_match.end()

            # Skip split points inside markdown links
            if self._is_inside_markdown_link(text, end_pos):
                continue

            last_char = word_text[-1]
            penultimate_char = word_text[-2] if len(word_text) > 1 else ""

            # Check for sentence end: . ! ? (avoid e.g., i.e., numbers like 2.5)
            is_sentence_end = (
                last_char in self.SENTENCE_PUNCTUATION
                and not (last_char == "." and word_text.lower() in {"e.g.", "i.e.", "etc.", "vs.", "mr.", "ms.", "dr."})
                and not (last_char == "." and penultimate_char.isdigit())
            )

            # Check for newline boundary
            is_newline = "\n" in text[word_match.start():end_pos]

            # 1. Primary: Sentence ending (. ! ? or newline)
            if (is_sentence_end or is_newline) and self.flush_on_sentence:
                if word_idx >= self.min_words:
                    return end_pos

            # If sentence_mode is disabled, allow clause and conjunction breaks
            if not self.sentence_mode:
                # 2. Clause punctuation (, ; : —)
                is_clause_end = (
                    last_char in self.CLAUSE_PUNCTUATION
                    or (len(word_text) > 1 and word_text[-1] in self.CLAUSE_PUNCTUATION)
                )
                if is_clause_end and word_idx >= self.min_words:
                    return end_pos

                # 3. Break before conjunction / preposition if word_idx >= min_words
                if i + 1 < len(words) and word_idx >= self.min_words:
                    next_word = words[i + 1].group(0).lower().strip(".,;:!?\"'()")
                    if next_word in self.BREAK_WORDS:
                        return end_pos

            # 4. Maximum words reached: force split at word boundary if sentence is excessively long
            if word_idx >= self.max_words:
                # Prefer splitting at a comma/clause if available in the long sentence
                is_clause_end = (
                    last_char in self.CLAUSE_PUNCTUATION
                    or (len(word_text) > 1 and word_text[-1] in self.CLAUSE_PUNCTUATION)
                )
                if is_clause_end or word_idx >= self.max_words + 10 or (not self.sentence_mode and i == num_complete_words - 1):
                    return end_pos

        return None

    def _extract_next_chunk(self) -> Optional[str]:
        """
        Check if the buffer can yield a chunk. If so, return it and update buffer.
        """
        split_idx = self._find_split_point(self.buffer)
        if split_idx is None:
            return None

        # Extract chunk up to split_idx
        chunk = self.buffer[:split_idx].strip()
        # Remainder starts after split_idx, stripped of leading whitespace
        remainder = self.buffer[split_idx:].lstrip()
        self.buffer = remainder

        if chunk:
            return chunk
        return None
