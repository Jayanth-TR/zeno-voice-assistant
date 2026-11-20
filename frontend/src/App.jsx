import { useEffect, useRef, useState } from "react";
import "./App.css";
import ZenoCharacter, { ZENO_STATES } from "./components/ZenoCharacter";
import SpeechBubbles3D from "./components/SpeechBubbles3D";
import { AudioQueueManager } from "./audioQueueManager";
import IndustrySelector from "./components/IndustrySelector";
import IndustryModal from "./components/IndustryModal";
import SuggestedQuestions from "./components/SuggestedQuestions";
import WhatsAppQRModal from "./components/WhatsAppQRModal";
import AdminLeadsDashboard from "./components/AdminLeadsDashboard";
import DemoRequestMobileForm from "./components/DemoRequestMobileForm";
import { DEFAULT_INDUSTRIES, fetchIndustriesConfig } from "./config/industriesData";
import { getZenoActionsForQuestion } from "./config/zenoActionsData";
import greetingAudioSrc from "./assets/audio/greeting.mp3";
import goodbyeAudioSrc from "./assets/audio/goodbye.mp3";
import ecommerceGreetingAudio from "./assets/audio/greeting_ecommerce.mp3";
import bankingGreetingAudio from "./assets/audio/greeting_banking.mp3";
import insuranceGreetingAudio from "./assets/audio/greeting_insurance.mp3";

const BUNDLED_INDUSTRY_GREETINGS = {
  ecommerce: ecommerceGreetingAudio,
  banking: bankingGreetingAudio,
  insurance: insuranceGreetingAudio,
};

const WELCOME_TEXT = "Welcome to Netcore. I am Zeno, your AI Brand Ambassador.";
const GREETING_TEXT = "Hey! I am Zeno, your AI Assistant. Please select your industry, and then let's clarify your questions.";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: GREETING_TEXT,
};

// Configurable no-speech timeout in milliseconds (8 seconds)
const NO_SPEECH_TIMEOUT_MS = 8000;
const GOODBYE_TEXT = "Thank you! It was great chatting with you. Have a wonderful day!";

// Dismissal detection (when user says No, Nope, That's all, Nothing, Thank you, etc.)
const DISMISSAL_REGEX = /^\s*(no|nope|nah|nay|that'?s?\s*(all|it)|that\s+is\s+(all|it)|that\s+will\s+be\s+all|nothing(\s+else)?|(im|i\s+am)\s+good|all\s+good|(im|i\s+am)\s+fine|bye|goodbye|done|not\s+really|not\s+right\s+now|thank\s*you|thanks|(i\s*dont|i\s*do\s*not)\s+have\s+(any|more|other)\s+questions?)\b/i;

function isNegativeDismissalText(text) {
  if (!text) return false;
  let cleaned = text.replace(/['’]/g, "").replace(/[^\w\s]/g, " ").toLowerCase();
  cleaned = cleaned.trim().replace(/\s+/g, " ");
  if (!cleaned) return false;
  const hasQuestionWord = /\b(what|how|why|when|where|who|tell|can you|explain|show|which)\b/i.test(cleaned);
  if (hasQuestionWord && cleaned.split(" ").length > 3) {
    return false;
  }
  return DISMISSAL_REGEX.test(cleaned);
}

// Greeting detection (when user says Hi, Hello, Hey, Good morning, etc.)
const GREETING_REGEX = /^\s*(hi|hello|hey|greetings|howdy|good\s+(morning|afternoon|evening|day)|whats\s*up|what\s+is\s+up)(\s+(zeno|there|bot|buddy|friend))?[!.,?]*\s*$/i;

function isGreetingText(text) {
  if (!text) return false;
  let cleaned = text.replace(/['’]/g, "").replace(/[^\w\s]/g, " ").toLowerCase();
  cleaned = cleaned.trim().replace(/\s+/g, " ");
  if (!cleaned) return false;
  const hasQuestionWord = /\b(what|how|why|when|where|who|tell|can you|explain|show|which|product|feature|price|cost)\b/i.test(cleaned);
  if (hasQuestionWord && cleaned.split(" ").length > 2) {
    return false;
  }
  return GREETING_REGEX.test(cleaned);
}

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getUniqueInternalSources(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const unique = [];
  for (const item of sources) {
    if (!item) continue;
    const docName = (item.source || "Unknown source").trim();
    const page =
      item.page !== null && item.page !== undefined ? String(item.page).trim() : "";
    const approval = (item.approval_status || "").trim();
    const key = `${docName}__p_${page}__status_${approval}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        source: docName,
        page: item.page !== null && item.page !== undefined ? item.page : null,
        approval_status: approval || null,
      });
    }
  }
  return unique;
}

function getUniqueWebSources(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const unique = [];
  for (const item of sources) {
    if (!item || !item.url) continue;
    const url = item.url.trim();
    if (!url) continue;
    const normalizedUrl = url.toLowerCase().replace(/\/+$/, "");
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push({
        title: item.title?.trim() || url,
        url: url,
      });
    }
  }
  return unique;
}

function formatApprovalStatus(status) {
  if (!status) return "";
  const map = {
    client_approved: "Client Approved",
    requires_validation: "Requires Validation",
    user_uploaded: "User Uploaded",
    public_source_unapproved: "Unapproved Public Source",
    source_reference: "Source Reference",
  };
  return map[status] || status.replace(/_/g, " ");
}

function getSupportedMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }
  const candidateTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/aac",
  ];
  for (const type of candidateTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function getPillClass(status) {
  if (!status) return "source-pill default";
  const s = status.toLowerCase();
  if (s.includes("approved")) return "source-pill approved";
  if (s.includes("validation")) return "source-pill validation";
  if (s.includes("uploaded")) return "source-pill uploaded";
  return "source-pill default";
}

function SourcesSection({ sources, messageId }) {
  if (!sources) return null;

  const internalSources = getUniqueInternalSources(sources.internal);
  const webSources = getUniqueWebSources(sources.web);

  const hasInternal = internalSources.length > 0;
  const hasWeb = webSources.length > 0;

  if (!hasInternal && !hasWeb) {
    return null;
  }

  return (
    <div className="sources-container">
      {hasInternal && (
        <div className="sources-group">
          <div className="sources-header internal">
            <span className="sources-header-icon">📄</span>
            <span>Internal Documents</span>
          </div>
          <ul className="sources-list">
            {internalSources.map((item, idx) => (
              <li
                key={`${messageId}-internal-${idx}-${item.source}-${item.page ?? "all"}`}
                className="source-item"
              >
                <span className="source-name">{item.source}</span>
                {item.page !== null && item.page !== undefined && (
                  <span className="source-page">Page {item.page}</span>
                )}
                {item.approval_status && (
                  <span className={getPillClass(item.approval_status)}>
                    {formatApprovalStatus(item.approval_status)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasWeb && (
        <div className="sources-group">
          <div className="sources-header web">
            <span className="sources-header-icon">🌐</span>
            <span>Web Sources</span>
          </div>
          <ul className="sources-list">
            {webSources.map((item, idx) => (
              <li
                key={`${messageId}-web-${idx}-${item.url}`}
                className="source-item"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  <span className="source-link-title">{item.title}</span>
                  <span className="source-link-icon" aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderFormattedContent(text) {
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
      .replace(/^\d+[\.)]\s+/, "")
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

// Voice Activity Detection (VAD) parameters
const VAD_CONFIG = {
  speechThreshold: 14,
  rmsThreshold: 0.015,
  silenceDurationMs: 2400, // Natural pause tolerance (2.4s) so multi-point questions aren't prematurely cut off
  minSpeechDurationMs: 250,
  maxRecordingDurationMs: 60000,
  smoothingTimeConstant: 0.25,
  fftSize: 512,
};

const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
const wsProtocol = isSecure ? "wss:" : "ws:";
const currentHost =
  typeof window !== "undefined" && window.location.host
    ? window.location.host
    : "localhost:5173";

function getVoiceWsUrls() {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const proto = secure ? "wss:" : "ws:";
  const host =
    typeof window !== "undefined" && window.location.host
      ? window.location.host
      : "localhost:5173";
  const hostname =
    typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "localhost";
  const port =
    typeof window !== "undefined" && window.location.port
      ? window.location.port
      : "5173";

  const urls = [];
  if (port === "8000") {
    urls.push(`${proto}//${host}/ws/voice`);
  } else {
    // 1. Vite proxy endpoint (/ws/voice)
    urls.push(`${proto}//${host}/ws/voice`);
    // 2. Direct connection to FastAPI backend on port 8000 (bypasses Vite dev proxy)
    urls.push(`${proto}//${hostname}:8000/ws/voice`);
    urls.push(`${proto}//127.0.0.1:8000/ws/voice`);
    urls.push(`${proto}//localhost:8000/ws/voice`);
  }
  return [...new Set(urls)];
}

// Route all requests through current host / Vite proxy (single port or HTTPS tunnel)
const TRANSCRIBE_WS_URL = `${wsProtocol}//${currentHost}/ws/transcribe`;
const VOICE_WS_URL = `${wsProtocol}//${currentHost}/ws/voice`;
const API_BASE_URL =
  typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "http://localhost:5173";

function downsampleTo24k(buffer, sampleRate) {
  if (sampleRate === 24000) return buffer;
  const ratio = sampleRate / 24000;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

function decodeAudioBuffer(audioCtx, arrayBuffer) {
  const copy = arrayBuffer.slice(0);
  return new Promise((resolve, reject) => {
    let settled = false;
    const onSuccess = (buffer) => {
      if (!settled) {
        settled = true;
        resolve(buffer);
      }
    };
    const onError = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };
    try {
      const result = audioCtx.decodeAudioData(copy, onSuccess, onError);
      if (result && typeof result.then === "function") {
        result.then(onSuccess, onError);
      }
    } catch (e) {
      onError(e);
    }
  });
}

function combineDeltas(currentText, delta) {
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

function App() {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const isComponentMountedRef = useRef(true);
  const connectSocketRef = useRef(null);
  const activeRequestIdRef = useRef(null);

  // Application Flow & Screen State: "start" | "conversation"
  const [currentScreen, setCurrentScreen] = useState("start");

  // Industry Workflow State
  const [industries, setIndustries] = useState(DEFAULT_INDUSTRIES);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const selectedIndustryRef = useRef(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const activeChallengeRef = useRef(null);
  const [hasAskedPrimary, setHasAskedPrimary] = useState(false);
  const hasAskedPrimaryRef = useRef(false);
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);
  const [showSampleQuestions, setShowSampleQuestions] = useState(false);

  // WhatsApp QR Code Lead Capture & Admin Dashboard State
  const [isWhatsAppQROpen, setIsWhatsAppQROpen] = useState(false);
  const [leadContext, setLeadContext] = useState({
    industry: "Retail & E-commerce",
    challenge: "Custom Enterprise Demo",
  });
  const [isAdminLeadsOpen, setIsAdminLeadsOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  // Poll leads stats for new leads badge
  useEffect(() => {
    const fetchLeadStats = () => {
      fetch(`${API_BASE_URL}/api/leads/stats`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.by_status) {
            setNewLeadsCount(data.by_status["New"] || 0);
          }
        })
        .catch(() => { });
    };
    fetchLeadStats();
    const interval = setInterval(fetchLeadStats, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchIndustriesConfig(API_BASE_URL).then((fetched) => {
      if (Array.isArray(fetched) && fetched.length > 0) {
        setIndustries(fetched);
      }
    });
  }, []);
  const currentScreenRef = useRef("start");

  // Character animation state
  const [characterState, setCharacterState] = useState(ZENO_STATES.IDLE);
  const characterStateRef = useRef(ZENO_STATES.IDLE);

  // Screen notices & interaction flags
  const [startPromptMessage, setStartPromptMessage] = useState(null);
  const [isGreetingActive, setIsGreetingActive] = useState(false);
  const [isEndingConversation, setIsEndingConversation] = useState(false);

  // Part 3: Show Chat Toggle Drawer
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatWindowRef = useRef(null);

  // Spoken Caption display for voice-first experience
  const [currentSpokenCaption, setCurrentSpokenCaption] = useState("");

  // 3D Floating Speech Bubbles State
  const [spokenBubbles, setSpokenBubbles] = useState([]);

  // Fullscreen helper for HoloBox kiosk installation
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => { });
    }
  };
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(0);
  const [streamingBubbleDelta, setStreamingBubbleDelta] = useState("");

  // What Zeno Does on Screen - Live Action Steps
  const [activeThinkingSteps, setActiveThinkingSteps] = useState([]);
  const [activeThinkingStepIndex, setActiveThinkingStepIndex] = useState(0);
  const thinkingTimerRef = useRef(null);

  const triggerThinkingSteps = (questionText, challengeId = null) => {
    const steps = getZenoActionsForQuestion(questionText, challengeId, selectedIndustryRef.current?.id);
    setActiveThinkingSteps(steps);
    setActiveThinkingStepIndex(0);

    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    let stepIdx = 0;
    thinkingTimerRef.current = setInterval(() => {
      stepIdx++;
      if (steps.length > 0) {
        setActiveThinkingStepIndex(stepIdx % steps.length);
      }
    }, 2000);
  };

  const clearThinkingSteps = () => {
    if (thinkingTimerRef.current) {
      clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  };

  // Part 1: Greeting Audio Synchronization Tracking
  const greetingAnimationFinishedRef = useRef(false);
  const greetingAudioFinishedRef = useRef(false);
  const isGreetingTurnRef = useRef(false);
  const greetingAudioSentRef = useRef(false);
  const greetingSafetyTimeoutRef = useRef(null);
  const preloadedGreetingBufferRef = useRef(null);
  const preloadedGoodbyeBufferRef = useRef(null);
  const preloadedIndustryBuffersRef = useRef({});
  const standaloneAudioRef = useRef(null);

  // Dismissal / Goodbye Flow Tracking
  const isDismissalTurnRef = useRef(false);
  const goodbyeAnimationFinishedRef = useRef(false);
  const goodbyeAudioFinishedRef = useRef(false);
  const goodbyeSafetyTimeoutRef = useRef(null);

  // Pre-decode bundled audio assets into AudioBuffers on mount
  useEffect(() => {
    const ctx = getPlaybackAudioContext();
    fetch(greetingAudioSrc)
      .then((res) => res.arrayBuffer())
      .then((arr) => {
        if (ctx) return decodeAudioBuffer(ctx, arr);
      })
      .then((buf) => {
        if (buf) {
          preloadedGreetingBufferRef.current = buf;
          console.log("[Zeno] Bundled greeting audio pre-decoded in memory.");
        }
      })
      .catch((err) => {
        console.warn("[Zeno] Note on pre-decoding greeting:", err);
      });

    fetch(goodbyeAudioSrc)
      .then((res) => res.arrayBuffer())
      .then((arr) => {
        if (ctx) return decodeAudioBuffer(ctx, arr);
      })
      .then((buf) => {
        if (buf) {
          preloadedGoodbyeBufferRef.current = buf;
          console.log("[Zeno] Bundled goodbye audio pre-decoded in memory.");
        }
      })
      .catch((err) => {
        console.warn("[Zeno] Note on pre-decoding goodbye:", err);
      });

    // Pre-decode each industry greeting from bundled assets for instant zero-latency playback
    Object.entries(BUNDLED_INDUSTRY_GREETINGS).forEach(([indId, audioSrc]) => {
      fetch(audioSrc)
        .then((res) => res.arrayBuffer())
        .then((arr) => {
          if (ctx) return decodeAudioBuffer(ctx, arr);
        })
        .then((buf) => {
          if (buf) {
            preloadedIndustryBuffersRef.current[indId] = buf;
            console.log(`[Zeno] Bundled greeting audio for ${indId} pre-decoded in memory.`);
          }
        })
        .catch((err) => {
          console.warn(`[Zeno] Note on pre-decoding bundled greeting for ${indId}:`, err);
        });
    });
  }, []);

  // Audio Device Selection & Output Routing (e.g. HDMI vs Earphones)
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedSinkId, setSelectedSinkId] = useState(
    () => (typeof localStorage !== "undefined" ? localStorage.getItem("zeno_audio_sink_id") || "default" : "default")
  );
  const [isTestingAudio, setIsTestingAudio] = useState(false);

  useEffect(() => {
    const updateAudioDevices = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioOutputDevices(outputs);
      } catch (err) {
        console.warn("[Zeno Audio] Unable to enumerate audio devices:", err);
      }
    };

    updateAudioDevices();
    navigator.mediaDevices?.addEventListener("devicechange", updateAudioDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", updateAudioDevices);
    };
  }, []);

  const handleAudioSinkChange = (newSinkId) => {
    setSelectedSinkId(newSinkId);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("zeno_audio_sink_id", newSinkId);
    }
    if (audioQueueManagerRef.current) {
      audioQueueManagerRef.current.setSinkId(newSinkId);
    }
    if (standaloneAudioRef.current && typeof standaloneAudioRef.current.setSinkId === "function") {
      standaloneAudioRef.current.setSinkId(newSinkId).catch(() => { });
    }
  };

  const handleTestAudio = () => {
    setIsTestingAudio(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const testCtx = new AudioCtx();
        if (selectedSinkId && selectedSinkId !== "default" && typeof testCtx.setSinkId === "function") {
          testCtx.setSinkId(selectedSinkId).catch(() => { });
        }
        if (testCtx.state === "suspended") {
          testCtx.resume().catch(() => { });
        }
        const now = testCtx.currentTime;
        // Play an elegant 3-tone chime (C5 523Hz -> E5 659Hz -> G5 784Hz)
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = testCtx.createOscillator();
          const gain = testCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.25, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
          osc.connect(gain);
          gain.connect(testCtx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.38);
        });
        setTimeout(() => {
          try {
            testCtx.close();
          } catch { }
        }, 1500);
      }
    } catch (err) {
      console.warn("[Zeno] Audio test error:", err);
    }
    setTimeout(() => {
      setIsTestingAudio(false);
    }, 1200);
  };

  // Part 2: Track completion trigger & sentence count to prevent premature microphone activations
  const hasTriggeredCompletionRef = useRef(false);
  const totalSentencesExpectedRef = useRef(null);

  const [connection, setConnection] = useState("Disconnected");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    characterStateRef.current = characterState;
  }, [characterState]);

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [micError, setMicError] = useState(null);

  // Voice Activity Detection (VAD) state
  const [vadStatus, setVadStatus] = useState("idle");
  const [liveAudioLevel, setLiveAudioLevel] = useState(0);

  // Live Realtime Transcription state
  const [liveTranscript, setLiveTranscript] = useState("");
  const [transcriptionStatus, setTranscriptionStatus] = useState("idle");
  const [, setRecordingId] = useState(null);
  const activeRecordingIdRef = useRef(null);
  const transcribeWsRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const muteGainRef = useRef(null);
  const initialInputRef = useRef("");
  const sendMessageRef = useRef(null);
  const liveTranscriptRef = useRef("");
  const lastDeltaTimestampRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const vadIntervalRef = useRef(null);
  const currentAudioLevelRef = useRef(0);

  // Audio Playback Queue using AudioQueueManager
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const isPlayingAudioRef = useRef(false);
  const activeAudioRequestIdRef = useRef(null);
  const audioQueueManagerRef = useRef(null);
  const timingMetricsRef = useRef(new Map());
  const enqueuedChunkSequencesRef = useRef(new Set());

  // Word-by-word streaming state & controller synchronized with audio playback
  const sentenceTextsRef = useRef(new Map());
  const wordStreamTimerRef = useRef(null);
  const pendingSpeechStreamRef = useRef(null);

  const stopWordStreamTimer = () => {
    if (wordStreamTimerRef.current) {
      clearInterval(wordStreamTimerRef.current);
      wordStreamTimerRef.current = null;
    }
  };

  const startSpeakingWordStream = (sequence, fullText, duration, isGreeting = false) => {
    stopWordStreamTimer();
    if (!fullText || typeof fullText !== "string") return;
    if (isEndingConversation || isDismissalTurnRef.current) return;

    const isGreetingMsg = Boolean(isGreeting || isGreetingTurnRef.current);
    const cleanText = fullText.replace(/[*_#`]/g, "").trim();
    if (!cleanText) return;

    const words = cleanText.split(/\s+/).filter(Boolean);
    if (words.length === 0) return;

    const bubbleId = `bubble-seq-${sequence}`;

    const chunkDuration = duration && duration > 0 ? duration : Math.max(words.length * 0.28, 1.8);
    const totalPacingMs = chunkDuration * 1000 * 0.88;
    const intervalMs = Math.max(Math.min(Math.floor(totalPacingMs / Math.max(words.length, 1)), 350), 60);

    console.log(`[Zeno Stream] Word stream seq ${sequence}: "${words.slice(0, 3).join(" ")}..." (${words.length} words, ${intervalMs}ms/word, duration: ${chunkDuration.toFixed(2)}s, greeting: ${isGreetingMsg})`);

    // Render initial word immediately
    setSpokenBubbles((prev) => {
      const next = [...prev];
      next[sequence] = {
        id: bubbleId,
        sequence,
        text: words[0],
        isStreaming: words.length > 1,
        isActive: true,
        isGreeting: isGreetingMsg,
      };
      return next;
    });

    if (words.length <= 1) {
      return;
    }

    let currentWordIdx = 1;
    wordStreamTimerRef.current = setInterval(() => {
      if (currentWordIdx < words.length) {
        const displayedText = words.slice(0, currentWordIdx + 1).join(" ");
        const stillStreaming = currentWordIdx < words.length - 1;
        setSpokenBubbles((prev) => {
          const next = [...prev];
          if (next[sequence]) {
            next[sequence] = {
              ...next[sequence],
              text: displayedText,
              isStreaming: stillStreaming,
              isActive: true,
              isGreeting: isGreetingMsg,
            };
          }
          return next;
        });
        currentWordIdx++;
      } else {
        stopWordStreamTimer();
      }
    }, intervalMs);
  };

  const stopAudioPlaybackRef = useRef(null);
  const startRecordingRef = useRef(null);
  const onAllAudioCompletedRef = useRef(null);
  const playNextInQueueRef = useRef(null);

  if (!audioQueueManagerRef.current) {
    audioQueueManagerRef.current = new AudioQueueManager({
      sinkId: typeof localStorage !== "undefined" ? localStorage.getItem("zeno_audio_sink_id") : null,
      onPlaybackStart: ({ requestId }) => {
        console.log(`[Zeno Audio] Playback started for request ${requestId}`);
        const m = timingMetricsRef.current.get(requestId);
        if (m && m.t_first_audio_playback === null) {
          m.t_first_audio_playback = performance.now();
          console.log(`[Zeno Metrics][${requestId}] First audio playback started at ${(m.t_first_audio_playback - m.t_sent).toFixed(1)}ms`);
        }
        setIsPlayingAudio(true);
        isPlayingAudioRef.current = true;
        if (!isGreetingTurnRef.current) {
          setCharacterState(ZENO_STATES.TALKING);
          characterStateRef.current = ZENO_STATES.TALKING;
        }
      },
      onChunkStart: ({ requestId, sequence, duration }) => {
        console.log(`[Zeno Audio] Chunk ${sequence} playing (duration: ${duration?.toFixed(2) || "?"}s)`);
        clearThinkingSteps();
        setIsPlayingAudio(true);
        isPlayingAudioRef.current = true;
        setActiveBubbleIndex(sequence);
        if (!isGreetingTurnRef.current) {
          setCharacterState(ZENO_STATES.TALKING);
          characterStateRef.current = ZENO_STATES.TALKING;
        }

        if (isDismissalTurnRef.current || isEndingConversation) {
          setSpokenBubbles([]);
          setCurrentSpokenCaption("");
          pendingSpeechStreamRef.current = null;
          return;
        }

        const entry = sentenceTextsRef.current.get(sequence);
        if (entry && entry.text) {
          startSpeakingWordStream(sequence, entry.text, duration);
          pendingSpeechStreamRef.current = null;
        } else {
          pendingSpeechStreamRef.current = { requestId, sequence, duration };
        }
      },
      onChunkEnd: ({ requestId, sequence }) => {
        console.log(`[Zeno Audio] Chunk ${sequence} finished.`);
        stopWordStreamTimer();

        if (isDismissalTurnRef.current || isEndingConversation) {
          setSpokenBubbles([]);
          return;
        }

        // Finalize this bubble with its complete text
        const entry = sentenceTextsRef.current.get(sequence);
        const fullText = entry ? entry.text : null;

        setSpokenBubbles((prev) => {
          const next = [...prev];
          if (next[sequence]) {
            next[sequence] = {
              ...next[sequence],
              text: fullText ? fullText.replace(/[*_#`]/g, "").trim() : next[sequence].text,
              isStreaming: false,
              isActive: false,
              isGreeting: Boolean(isGreetingTurnRef.current || next[sequence].isGreeting),
            };
          }
          return next;
        });

        // If queue is temporarily empty while LLM generation is still active, show Thinking
        if (loadingRef.current && audioQueueManagerRef.current?.chunks.size === 0) {
          setCharacterState(ZENO_STATES.THINKING);
          characterStateRef.current = ZENO_STATES.THINKING;
        }
      },
      onPlaybackComplete: ({ requestId, totalChunksPlayed, metrics }) => {
        console.log(`[Zeno Audio] All playback complete for request ${requestId}. Total chunks: ${totalChunksPlayed}`);
        stopWordStreamTimer();
        pendingSpeechStreamRef.current = null;

        setSpokenBubbles((prev) =>
          prev.map((b) => (b ? { ...b, isActive: false, isStreaming: false } : b))
        );

        const m = timingMetricsRef.current.get(requestId);
        if (m) {
          m.t_last_audio_playback = performance.now();
          const report = {
            requestId,
            firstTextDeltaMs: m.t_first_delta ? Number((m.t_first_delta - m.t_sent).toFixed(1)) : null,
            firstAudioChunkMs: m.t_first_audio_chunk ? Number((m.t_first_audio_chunk - m.t_sent).toFixed(1)) : null,
            firstPlaybackStartedMs: m.t_first_audio_playback ? Number((m.t_first_audio_playback - m.t_sent).toFixed(1)) : null,
            lastPlaybackCompletedMs: Number((m.t_last_audio_playback - m.t_sent).toFixed(1)),
            totalAudioDurationSeconds: metrics?.totalAudioDurationSeconds || null,
            averageChunkDurationSeconds: metrics?.averageChunkDurationSeconds || null,
            backendMetrics: m.backend_metrics,
          };
          console.log(`[Zeno Metrics][${requestId}] Turn Latency Report:`, report);
        }
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
        onAllAudioCompletedRef.current?.();
      },
      onPlaybackError: ({ requestId, sequence, error }) => {
        console.warn(`[Zeno Audio] Error on chunk ${sequence}:`, error);
      },
    });
  }

  const getPlaybackAudioContext = () => {
    return audioQueueManagerRef.current?.getAudioContext();
  };

  const stopAudioPlayback = () => {
    stopWordStreamTimer();
    pendingSpeechStreamRef.current = null;
    if (audioQueueManagerRef.current) {
      audioQueueManagerRef.current.stop();
    }
    if (standaloneAudioRef.current) {
      try {
        standaloneAudioRef.current.pause();
        standaloneAudioRef.current.currentTime = 0;
      } catch { }
      standaloneAudioRef.current = null;
    }
    isPlayingAudioRef.current = false;
    setIsPlayingAudio(false);
  };

  // Part 1: Check if Greeting speech has completed, then transition to Industry Selection
  const checkGreetingComplete = () => {
    if (!isGreetingTurnRef.current) return;

    if (!greetingAudioFinishedRef.current) {
      console.log("[Zeno Greeting] Synchronization check: waiting for greeting audio...");
      return;
    }

    console.log("[Zeno Greeting] Greeting speech completed. Finalizing transition!");
    if (greetingSafetyTimeoutRef.current) {
      clearTimeout(greetingSafetyTimeoutRef.current);
      greetingSafetyTimeoutRef.current = null;
    }

    stopWordStreamTimer();
    setSpokenBubbles([]);

    isGreetingTurnRef.current = false;
    setIsGreetingActive(false);

    // Transition screen and character
    setCurrentScreen("conversation");
    currentScreenRef.current = "conversation";

    // User requirement: Next show the option to select the industry!
    if (!selectedIndustryRef.current) {
      console.log("[Zeno] Opening industry selection modal right after greeting speech!");
      setIsIndustryModalOpen(true);
    } else {
      console.log("[Zeno] Industry selected. Switching to LISTENING and displaying business challenges (mic remains closed for user selection).");
      setCharacterState(ZENO_STATES.LISTENING);
      characterStateRef.current = ZENO_STATES.LISTENING;

      // Display the business challenge questions on the right side near the hand so user can select!
      setShowSampleQuestions(true);

      // Note: Microphone intentionally NOT opened here per user requirement.
      // The user chooses a question first; mic auto-activates only after the question's response completes.
    }
  };

  // -------------------------------------------------------------
  // PART 2: Automatically Activate Microphone After Every Answer
  // -------------------------------------------------------------
  const onAllAudioCompleted = () => {
    console.log("[Zeno] Audio completed. Turn state:", {
      isGreeting: isGreetingTurnRef.current,
      isDismissal: isDismissalTurnRef.current,
      screen: currentScreenRef.current,
      ending: isEndingConversation,
    });

    // 1. If this was the greeting turn, record audio completion
    if (isGreetingTurnRef.current) {
      greetingAudioFinishedRef.current = true;
      checkGreetingComplete();
      return;
    }

    // 2. DISMISSAL / GOODBYE COMPLETION:
    // If this turn was a dismissal (user said no / end of conversation)
    if (isDismissalTurnRef.current) {
      console.log("[Zeno] Dismissal thank-you turn completed. Transitioning to goodbye animation and returning home...");
      isDismissalTurnRef.current = false;
      triggerGoodbyeAndReturnHome(GOODBYE_TEXT, true);
      return;
    }

    // 3. PART 2: Answer completed! Automatically transition to Listening animation & activate microphone
    if (currentScreenRef.current === "conversation" && !isEndingConversation) {
      console.log("[Zeno Part 2] Answer complete. Transitioning to Listening animation and activating microphone...");

      // Stop Talking animation and transition to Listening animation
      setCharacterState(ZENO_STATES.LISTENING);
      characterStateRef.current = ZENO_STATES.LISTENING;

      // Bring back the sample questions!
      if (selectedIndustryRef.current) {
        setShowSampleQuestions(true);
      }

      // Remove speech bubbles from the screen once the answer has completed
      setTimeout(() => {
        if (!isPlayingAudioRef.current) {
          setSpokenBubbles([]);
        }
      }, 700);

      // Delay (400ms) to ensure audio context is quiet and echo cancellation settles
      setTimeout(() => {
        if (
          currentScreenRef.current === "conversation" &&
          !isEndingConversation &&
          !isPlayingAudioRef.current
        ) {
          console.log("[Zeno Part 2] Auto-activating microphone now!");
          startRecordingRef.current?.();
        }
      }, 400);
    }
  };

  useEffect(() => {
    playNextInQueueRef.current = () => audioQueueManagerRef.current?.playNext();
    stopAudioPlaybackRef.current = stopAudioPlayback;
    startRecordingRef.current = startRecording;
    onAllAudioCompletedRef.current = onAllAudioCompleted;
  });

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Web Audio VAD refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const vadAnimationRef = useRef(null);
  const vadStateRef = useRef(null);

  const closeTranscribeSocket = () => {
    if (transcribeWsRef.current) {
      try {
        if (
          transcribeWsRef.current.readyState === WebSocket.OPEN ||
          transcribeWsRef.current.readyState === WebSocket.CONNECTING
        ) {
          transcribeWsRef.current.close();
        }
      } catch {
        // Ignore close errors
      }
      transcribeWsRef.current = null;
    }
  };

  const cleanupAudioNodes = (closeSocket = false) => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (vadAnimationRef.current) {
      cancelAnimationFrame(vadAnimationRef.current);
      vadAnimationRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (muteGainRef.current) {
      try {
        muteGainRef.current.disconnect();
      } catch {
        // Ignore
      }
      muteGainRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // Ignore
      }
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Ignore
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
        }
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (closeSocket) {
      closeTranscribeSocket();
    }
  };

  // Section 5: No-speech timeout & reset handler
  const handleNoSpeechTimeout = () => {
    console.log("[Zeno] No speech detected within timeout period.");
    cancelRecording();
    // If user is already on the conversation screen, stay there with questions visible! Never kick them home!
    if (currentScreenRef.current === "conversation") {
      setCharacterState(ZENO_STATES.LISTENING);
      characterStateRef.current = ZENO_STATES.LISTENING;
      if (selectedIndustryRef.current) {
        setShowSampleQuestions(true);
      }
      return;
    }
    setCurrentScreen("start");
    currentScreenRef.current = "start";
    setCharacterState(ZENO_STATES.IDLE);
    characterStateRef.current = ZENO_STATES.IDLE;
    setStartPromptMessage("Are you still there? Let's try again!");
  };

  const stopAndSubmit = (directText = null) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (vadStateRef.current) {
      vadStateRef.current.isFinished = true;
    }

    const textCandidate = (
      directText ||
      liveTranscriptRef.current ||
      liveTranscript ||
      input
    ).trim();

    cleanupAudioNodes(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    setVadStatus("idle");
    setLiveAudioLevel(0);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingDuration(0);

    if (textCandidate) {
      getPlaybackAudioContext();
      setTranscriptionStatus("completed");
      setLiveTranscript(textCandidate);
      liveTranscriptRef.current = "";
      lastDeltaTimestampRef.current = null;
      initialInputRef.current = "";
      setInput("");
      setAudioBlob(null);

      // Section 6: Question Processing -> Thinking animation
      setCharacterState(ZENO_STATES.THINKING);
      characterStateRef.current = ZENO_STATES.THINKING;

      if (transcribeWsRef.current && transcribeWsRef.current.readyState === WebSocket.OPEN) {
        try {
          transcribeWsRef.current.send(JSON.stringify({
            type: "commit",
            recording_id: activeRecordingIdRef.current,
          }));
        } catch {
          // Ignore
        }
      }

      if (sendMessageRef.current) {
        sendMessageRef.current(textCandidate);
      }

      setTimeout(() => {
        closeTranscribeSocket();
        isSubmittingRef.current = false;
      }, 400);
    } else {
      // Crucial: No words were transcribed yet. DO NOT shut off the microphone!
      // Keep microphone active and continue listening for the visitor's answer!
      console.log("[Zeno] No words transcribed yet. Keeping microphone open...");
      isSubmittingRef.current = false;
      if (vadStateRef.current) {
        vadStateRef.current.hasSpoken = false;
        vadStateRef.current.silenceStartTime = null;
        vadStateRef.current.isFinished = false;
      }
      setVadStatus("listening");
      setCharacterState(ZENO_STATES.LISTENING);
      characterStateRef.current = ZENO_STATES.LISTENING;
    }
  };

  const cancelRecording = (reason = null) => {
    isSubmittingRef.current = true;
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (vadStateRef.current) {
      vadStateRef.current.isFinished = true;
    }
    if (transcribeWsRef.current && transcribeWsRef.current.readyState === WebSocket.OPEN) {
      try {
        transcribeWsRef.current.send(JSON.stringify({
          type: "cancel",
          recording_id: activeRecordingIdRef.current,
        }));
      } catch {
        // Ignore
      }
    }
    activeRecordingIdRef.current = null;
    closeTranscribeSocket();
    chunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }

    cleanupAudioNodes(true);
    setIsRecording(false);
    isRecordingRef.current = false;
    setVadStatus("idle");
    setTranscriptionStatus("idle");
    setLiveAudioLevel(0);
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    lastDeltaTimestampRef.current = null;
    if (initialInputRef.current) {
      setInput(initialInputRef.current);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingDuration(0);

    if (typeof reason === "string" && reason.trim()) {
      setMicError(reason);
    } else {
      setMicError(null);
    }
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 200);
  };

  const startRecording = async () => {
    setMicError(null);

    getPlaybackAudioContext();

    // Guard: Clean up any existing recording session first to avoid duplicate streams
    if (isRecordingRef.current) {
      cleanupAudioNodes(true);
      isRecordingRef.current = false;
      setIsRecording(false);
    }

    // If speech is playing, clicking mic acts as an interrupt
    if (loadingRef.current || isPlayingAudioRef.current) {
      stopAudioPlayback();
      const cancelReqId = activeRequestIdRef.current || activeAudioRequestIdRef.current;
      if (socketRef.current?.readyState === WebSocket.OPEN && cancelReqId) {
        socketRef.current.send(
          JSON.stringify({
            type: "cancel_generation",
            request_id: cancelReqId,
          })
        );
      }
      activeRequestIdRef.current = null;
      activeAudioRequestIdRef.current = null;
      setLoading(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg))
      );
    }

    // Set character to Listening animation
    setCharacterState(ZENO_STATES.LISTENING);
    characterStateRef.current = ZENO_STATES.LISTENING;
    setSpokenBubbles([]);

    setMicError(null);
    setAudioBlob(null);
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    lastDeltaTimestampRef.current = null;
    initialInputRef.current = input;
    isRecordingRef.current = true;

    const newRecordingId = createRequestId();
    activeRecordingIdRef.current = newRecordingId;
    setRecordingId(newRecordingId);
    setTranscriptionStatus("listening");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setMicError(
          `Microphone is blocked by Chrome on HTTP over Wi-Fi (${window.location.hostname}). To enable: open chrome://flags/#unsafely-treat-insecure-origin-as-secure, add ${window.location.origin}, enable and relaunch.`
        );
      } else {
        setMicError("Microphone recording is not supported or was blocked by this browser.");
      }
      setTranscriptionStatus("error");
      setCharacterState(ZENO_STATES.SAD);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      try {
        const transcribeWs = new WebSocket(`${TRANSCRIBE_WS_URL}?recording_id=${newRecordingId}`);
        transcribeWs.binaryType = "arraybuffer";
        transcribeWsRef.current = transcribeWs;

        transcribeWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.recording_id && data.recording_id !== activeRecordingIdRef.current) {
              return;
            }

            if (data.type === "transcript_delta") {
              setTranscriptionStatus("transcribing");
              const now = Date.now();
              lastDeltaTimestampRef.current = now;
              // Reset timeout immediately when speech is detected
              if (vadStateRef.current) {
                vadStateRef.current.hasSpoken = true;
                vadStateRef.current.silenceStartTime = null;
              }
              const updated = combineDeltas(liveTranscriptRef.current, data.delta);
              liveTranscriptRef.current = updated;
              setLiveTranscript(updated);

              const prefix = initialInputRef.current ? `${initialInputRef.current.trim()} ` : "";
              setInput(prefix + updated.trimStart());
            } else if (data.type === "transcript_complete") {
              const completedText = (data.transcript || "").trim();
              if (completedText) {
                liveTranscriptRef.current = completedText;
                stopAndSubmit(completedText);
              } else if (isRecordingRef.current) {
                if (liveTranscriptRef.current.trim()) {
                  stopAndSubmit(liveTranscriptRef.current);
                } else {
                  handleNoSpeechTimeout();
                }
              }
            } else if (data.type === "error") {
              setTranscriptionStatus("error");
              setMicError(`Transcription error: ${data.message || "Failed to transcribe audio."}`);
              setCharacterState(ZENO_STATES.SAD);
              closeTranscribeSocket();
            }
          } catch {
            // Ignore parse errors
          }
        };

        transcribeWs.onerror = () => {
          // Handled gracefully
        };
      } catch (err) {
        console.warn("Could not initiate transcription socket:", err);
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      let audioContext;
      try {
        audioContext = new AudioCtx({ sampleRate: 24000 });
      } catch {
        audioContext = new AudioCtx();
      }
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = VAD_CONFIG.fftSize;
      analyser.smoothingTimeConstant = VAD_CONFIG.smoothingTimeConstant;
      analyserRef.current = analyser;

      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      muteGainRef.current = muteGain;

      sourceNode.connect(analyser);
      analyser.connect(processor);
      processor.connect(muteGain);
      muteGain.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const inputChannel = e.inputBuffer.getChannelData(0);

        let sumSquares = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sumSquares += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannel.length);
        const level = Math.min(100, Math.round(rms * 400));
        currentAudioLevelRef.current = level;

        const now = Date.now();
        if (vadStateRef.current && !vadStateRef.current.isFinished) {
          if (level >= VAD_CONFIG.speechThreshold || rms >= VAD_CONFIG.rmsThreshold) {
            vadStateRef.current.hasSpoken = true;
            vadStateRef.current.silenceStartTime = null;
            vadStateRef.current.totalSpeechTime += 100;
            setVadStatus("speaking");
          } else if (vadStateRef.current.hasSpoken) {
            if (vadStateRef.current.silenceStartTime === null) {
              vadStateRef.current.silenceStartTime = now;
            }
            setVadStatus("pausing");
          }
        }

        if (transcribeWsRef.current && transcribeWsRef.current.readyState === WebSocket.OPEN) {
          const resampled = downsampleTo24k(inputChannel, audioContext.sampleRate);
          const pcmBuffer = floatTo16BitPCM(resampled);
          transcribeWsRef.current.send(pcmBuffer);
        }
      };

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const finalMime = recorder.mimeType || mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: finalMime });
          setAudioBlob(blob);
          setAudioUrl((prevUrl) => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return URL.createObjectURL(blob);
          });
        }
        cleanupAudioNodes(false);
        setIsRecording(false);
        isRecordingRef.current = false;
        setVadStatus("idle");
        setLiveAudioLevel(0);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingDuration(0);
      };

      recorder.onerror = (event) => {
        setMicError(`Microphone recording error: ${event.error?.message || "Unknown error"}`);
        setCharacterState(ZENO_STATES.SAD);
        cancelRecording();
      };

      recorder.start(100);
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingDuration(0);
      setVadStatus("listening");

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Part 2: Initialize VAD & 8-second no-speech detection timer
      const vadState = {
        hasSpoken: false,
        silenceStartTime: null,
        totalSpeechTime: 0,
        recordingStartTime: Date.now(),
        isFinished: false,
      };
      vadStateRef.current = vadState;

      const vadInterval = setInterval(() => {
        if (!isRecordingRef.current || isSubmittingRef.current) {
          clearInterval(vadInterval);
          return;
        }

        const now = Date.now();
        const state = vadStateRef.current;
        if (!state || state.isFinished) {
          clearInterval(vadInterval);
          return;
        }

        const hasRecognizedWords = Boolean(
          liveTranscriptRef.current && liveTranscriptRef.current.trim().length > 0
        );
        if (hasRecognizedWords) {
          state.hasSpoken = true;
        }

        // Part 2: Maintain configurable 8-second initial no-speech timeout
        if (!state.hasSpoken) {
          const initialElapsed = now - state.recordingStartTime;
          if (initialElapsed >= NO_SPEECH_TIMEOUT_MS) {
            clearInterval(vadInterval);
            handleNoSpeechTimeout();
            return;
          }
        }

        // Adaptive silence duration: grant a longer pause window (3200ms) if the sentence ends on an unfinished trailing word
        const transcriptText = (liveTranscriptRef.current || "").trim();
        const trailingCutOff = Boolean(
          transcriptText &&
          /\b(and|or|but|to|the|a|an|is|are|was|were|of|in|for|with|about|that|which|who|whom|at|by|from|on|into|because|so|if|than|like|also|what\s+about)\s*$/i.test(
            transcriptText
          )
        );
        const effectiveSilenceMs = trailingCutOff ? 3200 : VAD_CONFIG.silenceDurationMs;

        // Stop 1: Transcript idle (silence after recognized words)
        const deltaElapsed = lastDeltaTimestampRef.current
          ? now - lastDeltaTimestampRef.current
          : null;

        if (
          hasRecognizedWords &&
          deltaElapsed !== null &&
          deltaElapsed >= effectiveSilenceMs
        ) {
          clearInterval(vadInterval);
          stopAndSubmit();
          return;
        }

        // Stop 2: Continuous audio silence after recognized speech
        const hasTranscribedText = Boolean(
          transcriptText && transcriptText.length > 0
        );

        if (hasTranscribedText && state.hasSpoken && state.silenceStartTime !== null) {
          const silenceElapsed = now - state.silenceStartTime;
          if (silenceElapsed >= effectiveSilenceMs) {
            clearInterval(vadInterval);
            stopAndSubmit();
            return;
          }
        }

        if (now - state.recordingStartTime >= VAD_CONFIG.maxRecordingDurationMs) {
          clearInterval(vadInterval);
          stopAndSubmit();
          return;
        }
      }, 50);
      vadIntervalRef.current = vadInterval;

      const runVisualizerLoop = () => {
        if (!isRecordingRef.current) return;
        setLiveAudioLevel(currentAudioLevelRef.current);
        vadAnimationRef.current = requestAnimationFrame(runVisualizerLoop);
      };
      vadAnimationRef.current = requestAnimationFrame(runVisualizerLoop);
    } catch (err) {
      cleanupAudioNodes(true);
      setIsRecording(false);
      isRecordingRef.current = false;
      setVadStatus("idle");
      setLiveAudioLevel(0);
      setCharacterState(ZENO_STATES.SAD);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          setMicError(
            `Microphone access is blocked by browser security on HTTP (${window.location.hostname}). Open chrome://flags/#unsafely-treat-insecure-origin-as-secure, add ${window.location.origin}, enable and relaunch.`
          );
        } else {
          setMicError("Microphone access was denied. Please allow microphone permissions in your browser.");
        }
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setMicError("No microphone device was detected on your system.");
      } else {
        setMicError(`Unable to start microphone: ${err.message || err.name}`);
      }
    }
  };

  const discardAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
  };

  const handleToggleMic = () => {
    // 1. If audio is speaking/playing, clicking the mic acts as an interrupt
    if (isPlayingAudio || isGreetingActive) {
      stopAudioPlayback();
      return;
    }

    // 2. If microphone is active/recording, user manual click turns off mic immediately
    if (isRecording) {
      console.log("[Zeno] User manually clicked mic button while recording.");
      const textCandidate = (
        liveTranscriptRef.current ||
        liveTranscript ||
        input
      ).trim();

      if (textCandidate) {
        stopAndSubmit(textCandidate);
      } else {
        console.log("[Zeno] Turning off microphone manually.");
        cancelRecording();
      }
      return;
    }

    // 3. Otherwise start recording
    startRecording();
  };

  // -------------------------------------------------------------
  // PART 1: Fix Greeting Audio & Synchronization
  // -------------------------------------------------------------
  const playStandaloneAudio = (audioSrc, audioBuffer, onEndedCallback, maxDurationMs = 8500) => {
    // 1. Resume AudioContext so browser knows audio is enabled
    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => { });
      }
    } catch { }

    if (standaloneAudioRef.current) {
      try {
        standaloneAudioRef.current.pause();
        standaloneAudioRef.current.currentTime = 0;
      } catch { }
      standaloneAudioRef.current = null;
    }

    let finished = false;
    let safetyTimeout = null;

    const handleEnded = () => {
      if (!finished) {
        finished = true;
        if (safetyTimeout) {
          clearTimeout(safetyTimeout);
          safetyTimeout = null;
        }
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
        if (onEndedCallback) {
          onEndedCallback();
        }
      }
    };

    // Watchdog timer: ensure standalone audio never blocks UI flow
    safetyTimeout = setTimeout(() => {
      console.warn("[Zeno Audio] Standalone audio safety watchdog triggered.");
      handleEnded();
    }, maxDurationMs);

    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;

    // Use HTML5 Audio element for 100% reliable system audio output & earphone routing
    try {
      console.log("[Zeno Audio] Playing standalone audio via HTML5 Audio element:", audioSrc);
      const audio = new Audio(audioSrc);
      standaloneAudioRef.current = audio;
      audio.volume = 1.0;
      audio.preload = "auto";

      if (selectedSinkId && selectedSinkId !== "default" && typeof audio.setSinkId === "function") {
        audio.setSinkId(selectedSinkId).catch(() => { });
      }

      audio.onended = () => {
        console.log("[Zeno Audio] HTML5 Audio playback completed.");
        standaloneAudioRef.current = null;
        handleEnded();
      };

      audio.onerror = (err) => {
        console.warn("[Zeno Audio] HTML5 Audio error, trying public URL fallback:", err);
        standaloneAudioRef.current = null;
        const fallbackUrl = audioSrc.includes("goodbye") ? "/goodbye.mp3" : "/greeting.mp3";
        try {
          const fallbackAudio = new Audio(fallbackUrl);
          standaloneAudioRef.current = fallbackAudio;
          fallbackAudio.volume = 1.0;
          if (selectedSinkId && selectedSinkId !== "default" && typeof fallbackAudio.setSinkId === "function") {
            fallbackAudio.setSinkId(selectedSinkId).catch(() => { });
          }
          fallbackAudio.onended = () => {
            standaloneAudioRef.current = null;
            handleEnded();
          };
          fallbackAudio.onerror = () => {
            standaloneAudioRef.current = null;
            if (audioBuffer && audioQueueManagerRef.current) {
              audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
            } else {
              handleEnded();
            }
          };
          fallbackAudio.play().catch(() => {
            standaloneAudioRef.current = null;
            if (audioBuffer && audioQueueManagerRef.current) {
              audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
            } else {
              handleEnded();
            }
          });
        } catch {
          if (audioBuffer && audioQueueManagerRef.current) {
            audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
          } else {
            handleEnded();
          }
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[Zeno Audio] HTML5 Audio playing loud and clear.");
          })
          .catch((err) => {
            console.warn("[Zeno Audio] HTML5 Audio play() rejected, trying Web Audio API buffer:", err);
            standaloneAudioRef.current = null;
            if (audioBuffer && audioQueueManagerRef.current) {
              audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
            } else {
              handleEnded();
            }
          });
      }
    } catch (err) {
      console.warn("[Zeno Audio] HTML5 Audio instantiation failed, trying Web Audio API buffer:", err);
      if (audioBuffer && audioQueueManagerRef.current) {
        audioQueueManagerRef.current.playDirectBuffer(audioBuffer, handleEnded);
      } else {
        handleEnded();
      }
    }
  };

  const playDirectAudioBuffer = (buffer, onEndedCallback) => {
    playStandaloneAudio(greetingAudioSrc, buffer, onEndedCallback);
  };

  const triggerWelcomeGreeting = () => {
    const audioCtx = getPlaybackAudioContext();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => { });
    }
    setStartPromptMessage(null);
    setMicError(null);

    // Reset state flags for synchronization
    greetingAnimationFinishedRef.current = false;
    greetingAudioFinishedRef.current = false;
    isGreetingTurnRef.current = true;
    greetingAudioSentRef.current = true;
    hasTriggeredCompletionRef.current = false;

    // Switch character to Greeting animation and display greeting text
    setIsGreetingActive(true);
    setCharacterState(ZENO_STATES.GREETING);
    characterStateRef.current = ZENO_STATES.GREETING;
    setCurrentSpokenCaption(GREETING_TEXT);

    const audioDuration = preloadedGreetingBufferRef.current?.duration || 6.1;
    startSpeakingWordStream(0, GREETING_TEXT, audioDuration, true);

    console.log("[Zeno Greeting] Starting greeting voice playback immediately.");
    playStandaloneAudio(greetingAudioSrc, preloadedGreetingBufferRef.current, () => {
      console.log("[Zeno Greeting] Greeting audio finished playing.");
      greetingAudioFinishedRef.current = true;
      checkGreetingComplete();
    });

    if (greetingSafetyTimeoutRef.current) {
      clearTimeout(greetingSafetyTimeoutRef.current);
    }
    // Greeting.mp4 is ~8.07s; timeout set to 10.0s to allow full video & voice playback
    greetingSafetyTimeoutRef.current = setTimeout(() => {
      if (isGreetingTurnRef.current) {
        console.warn("[Zeno] Greeting timeout safety fallback triggered.");
        greetingAudioFinishedRef.current = true;
        greetingAnimationFinishedRef.current = true;
        checkGreetingComplete();
      }
    }, 11000);
  };

  const triggerIndustryGreeting = async (industryObj) => {
    const audioCtx = getPlaybackAudioContext();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => { });
    }
    setStartPromptMessage(null);
    setMicError(null);

    const greetingText = industryObj?.greeting || GREETING_TEXT;

    greetingAnimationFinishedRef.current = false;
    greetingAudioFinishedRef.current = false;
    isGreetingTurnRef.current = true;
    greetingAudioSentRef.current = true;
    hasTriggeredCompletionRef.current = false;

    setIsGreetingActive(true);
    setCharacterState(ZENO_STATES.GREETING);
    characterStateRef.current = ZENO_STATES.GREETING;
    setCurrentSpokenCaption(greetingText);

    // Calculate word streaming pacing (~2.5 words per sec)
    const words = greetingText.split(/\s+/).length;
    const estDuration = Math.max(3.5, words / 2.6);
    const estDurationMs = Math.round((estDuration + 3.5) * 1000);
    startSpeakingWordStream(0, greetingText, estDuration, true);

    console.log("[Zeno Industry Greeting] Triggering greeting for:", industryObj?.name);

    if (greetingSafetyTimeoutRef.current) {
      clearTimeout(greetingSafetyTimeoutRef.current);
    }
    greetingSafetyTimeoutRef.current = setTimeout(() => {
      if (isGreetingTurnRef.current) {
        console.warn("[Zeno] Industry greeting timeout safety fallback triggered.");
        greetingAudioFinishedRef.current = true;
        greetingAnimationFinishedRef.current = true;
        checkGreetingComplete();
      }
    }, estDurationMs);

    // ZERO-LATENCY INSTANT PLAYBACK: Use pre-decoded industry audio buffer if ready
    const preloadedBuffer = preloadedIndustryBuffersRef.current[industryObj?.id];

    if (preloadedBuffer) {
      console.log("[Zeno Industry Greeting] Playing pre-decoded industry audio immediately (0ms latency):", industryObj?.id);
      const audioDuration = preloadedBuffer.duration || estDuration;
      startSpeakingWordStream(0, greetingText, audioDuration, true);
      playStandaloneAudio(null, preloadedBuffer, () => {
        console.log("[Zeno Industry Greeting] Pre-decoded greeting audio playback completed.");
        greetingAudioFinishedRef.current = true;
        checkGreetingComplete();
      }, estDurationMs);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: greetingText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          const audioSrc = `data:audio/mp3;base64,${data.audio}`;
          playStandaloneAudio(audioSrc, null, () => {
            console.log("[Zeno Industry Greeting] Dynamic greeting audio playback completed.");
            greetingAudioFinishedRef.current = true;
            checkGreetingComplete();
          }, estDurationMs);
          return;
        }
      }
    } catch (err) {
      console.warn("[Zeno] Failed to fetch dynamic industry greeting, using fallback audio:", err);
    }

    // Fallback: bundled industry audio asset direct playback
    const bundledIndustrySrc = BUNDLED_INDUSTRY_GREETINGS[industryObj?.id];
    const fallbackBuffer = preloadedBuffer || preloadedIndustryBuffersRef.current[industryObj?.id];
    const fallbackSrc = bundledIndustrySrc || greetingAudioSrc;
    const audioDuration = fallbackBuffer?.duration || estDuration;

    console.log("[Zeno Industry Greeting] Playing bundled audio asset for industry:", industryObj?.id);
    playStandaloneAudio(fallbackSrc, fallbackBuffer, () => {
      greetingAudioFinishedRef.current = true;
      checkGreetingComplete();
    }, estDurationMs);
  };

  const handleStartConversation = triggerWelcomeGreeting;

  const returnToHomePage = () => {
    console.log("[Zeno Goodbye] Ending message finished. Returning to homepage now.");
    if (goodbyeSafetyTimeoutRef.current) {
      clearTimeout(goodbyeSafetyTimeoutRef.current);
      goodbyeSafetyTimeoutRef.current = null;
    }

    setTimeout(() => {
      setIsEndingConversation(false);
      resetConversation();
      setCurrentScreen("start");
      currentScreenRef.current = "start";
      setSelectedIndustry(null);
      selectedIndustryRef.current = null;
      setActiveChallenge(null);
      activeChallengeRef.current = null;
      setHasAskedPrimary(false);
      hasAskedPrimaryRef.current = false;
      setShowSampleQuestions(false);
      setIsIndustryModalOpen(false);
      setCharacterState(ZENO_STATES.IDLE);
      characterStateRef.current = ZENO_STATES.IDLE;
      setStartPromptMessage(null);
      setCurrentSpokenCaption("");
    }, 250);
  };

  const triggerGoodbyeAndReturnHome = (spokenCaption = GOODBYE_TEXT, shouldPlayAudio = true) => {
    console.log("[Zeno] Triggering goodbye sequence and returning to homepage (shouldPlayAudio=" + shouldPlayAudio + ")...");
    setIsEndingConversation(true);
    setShowSampleQuestions(false);
    clearThinkingSteps();
    cancelRecording();
    stopAudioPlayback();
    stopWordStreamTimer();
    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setCurrentSpokenCaption("");

    const audioCtx = getPlaybackAudioContext();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => { });
    }

    const cancelReqId = activeRequestIdRef.current || activeAudioRequestIdRef.current;
    if (cancelReqId && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "cancel_generation",
          request_id: cancelReqId,
        })
      );
    }
    activeRequestIdRef.current = null;
    activeAudioRequestIdRef.current = null;
    setLoading(false);
    loadingRef.current = false;

    goodbyeAnimationFinishedRef.current = false;
    goodbyeAudioFinishedRef.current = false;

    // Transition character to Goodbye wave animation
    setCharacterState(ZENO_STATES.GOODBYE);
    characterStateRef.current = ZENO_STATES.GOODBYE;
    setCurrentSpokenCaption("");

    // Helper to return home only when BOTH audio and goodbye animation are finished
    const checkGoodbyeComplete = () => {
      if (goodbyeAudioFinishedRef.current && goodbyeAnimationFinishedRef.current) {
        returnToHomePage();
      }
    };

    if (shouldPlayAudio) {
      console.log("[Zeno Goodbye] Starting goodbye voice playback immediately.");
      playStandaloneAudio(goodbyeAudioSrc, preloadedGoodbyeBufferRef.current, () => {
        console.log("[Zeno Goodbye] Ending message spoken completely.");
        goodbyeAudioFinishedRef.current = true;
        checkGoodbyeComplete();
      });
    } else {
      goodbyeAudioFinishedRef.current = true;
    }

    if (goodbyeSafetyTimeoutRef.current) {
      clearTimeout(goodbyeSafetyTimeoutRef.current);
    }

    // Safety timeout in case playback or video is interrupted (8.9s video duration)
    goodbyeSafetyTimeoutRef.current = setTimeout(() => {
      console.warn("[Zeno] Goodbye timeout fallback triggered.");
      returnToHomePage();
    }, 9500);
  };

  const handleEndConversation = () => {
    if (isEndingConversation) return;

    if (loadingRef.current) {
      const cancelReqId = activeRequestIdRef.current || activeAudioRequestIdRef.current;
      if (socketRef.current?.readyState === WebSocket.OPEN && cancelReqId) {
        socketRef.current.send(
          JSON.stringify({
            type: "cancel_generation",
            request_id: cancelReqId,
          })
        );
      }
      activeRequestIdRef.current = null;
      activeAudioRequestIdRef.current = null;
      setLoading(false);
    }

    triggerGoodbyeAndReturnHome(GOODBYE_TEXT, true);
  };

  const handleCharacterEnded = (endedState) => {
    console.log("[ZenoCharacter] Video ended event for state:", endedState);

    // Part 1: Video ended event for Greeting
    if (endedState === ZENO_STATES.GREETING) {
      greetingAnimationFinishedRef.current = true;
      if (currentScreenRef.current === "conversation" && characterStateRef.current === ZENO_STATES.GREETING) {
        if (isPlayingAudioRef.current) {
          console.log("[ZenoCharacter] Greeting video ended, but voice is still playing -> switching to TALKING");
          setCharacterState(ZENO_STATES.TALKING);
          characterStateRef.current = ZENO_STATES.TALKING;
        } else {
          const nextState = selectedIndustryRef.current ? ZENO_STATES.LISTENING : ZENO_STATES.IDLE;
          setCharacterState(nextState);
          characterStateRef.current = nextState;
        }
      }
      checkGreetingComplete();
    } else if (endedState === ZENO_STATES.GOODBYE) {
      console.log("[Zeno Goodbye] Goodbye video animation ended.");
      goodbyeAnimationFinishedRef.current = true;
      // If audio already completed or was not playing, return to homepage
      if (goodbyeAudioFinishedRef.current) {
        returnToHomePage();
      }
    }
  };

  useEffect(() => {
    isComponentMountedRef.current = true;
    let currentSocket = null;

    const connect = (isManual = false) => {
      if (!isComponentMountedRef.current) return;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (isManual) {
        reconnectAttemptRef.current = 0;
      }

      // Close previous dead socket if any
      if (currentSocket) {
        try {
          currentSocket.onopen = null;
          currentSocket.onmessage = null;
          currentSocket.onerror = null;
          currentSocket.onclose = null;
          if (
            currentSocket.readyState === WebSocket.OPEN ||
            currentSocket.readyState === WebSocket.CONNECTING
          ) {
            currentSocket.close();
          }
        } catch { }
        currentSocket = null;
      }

      const candidateUrls = getVoiceWsUrls();
      const attempt = reconnectAttemptRef.current;
      const targetUrl = candidateUrls[attempt % candidateUrls.length];
      console.log(`[Zeno WebSocket] Connecting to ${targetUrl} (attempt ${attempt + 1})...`);

      setConnection("Connecting...");

      let socket;
      try {
        socket = new WebSocket(targetUrl);
      } catch (err) {
        console.warn(`[Zeno WebSocket] Failed to construct WebSocket for ${targetUrl}:`, err);
        scheduleReconnect();
        return;
      }

      currentSocket = socket;
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isComponentMountedRef.current) return;
        console.log(`[Zeno WebSocket] Successfully connected to ${targetUrl}`);
        setConnection("Connected");
        reconnectAttemptRef.current = 0;
        if (characterStateRef.current === ZENO_STATES.SAD) {
          setCharacterState(ZENO_STATES.IDLE);
          characterStateRef.current = ZENO_STATES.IDLE;
        }

        // Immediately preload greeting & goodbye audio for instant zero-latency playback
        try {
          socket.send(
            JSON.stringify({
              type: "greeting_tts",
              request_id: "preload-greeting",
              text: GREETING_TEXT,
            })
          );
          socket.send(
            JSON.stringify({
              type: "goodbye_tts",
              request_id: "preload-goodbye",
              text: GOODBYE_TEXT,
            })
          );
        } catch (sendErr) {
          console.warn("[Zeno WebSocket] Failed to send preload requests:", sendErr);
        }
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const requestId = data.request_id;

        if (
          data.type === "preloaded_greeting_audio" ||
          (data.type === "assistant_audio" && requestId === "preload-greeting")
        ) {
          if (data.audio) {
            try {
              const byteChars = atob(data.audio);
              const byteNumbers = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteNumbers[i] = byteChars.charCodeAt(i);
              }
              const audioCtx = getPlaybackAudioContext();
              decodeAudioBuffer(audioCtx, byteNumbers.buffer)
                .then((buf) => {
                  preloadedGreetingBufferRef.current = buf;
                  console.log("[Zeno] Preloaded greeting audio decoded and ready in memory.");
                })
                .catch((err) => {
                  console.warn("Failed to decode preloaded greeting audio:", err);
                });
            } catch (err) {
              console.warn("Error processing preloaded greeting audio:", err);
            }
          }
          return;
        }

        if (
          data.type === "preloaded_goodbye_audio" ||
          (data.type === "assistant_audio" && requestId === "preload-goodbye")
        ) {
          if (data.audio) {
            try {
              const byteChars = atob(data.audio);
              const byteNumbers = new Uint8Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) {
                byteNumbers[i] = byteChars.charCodeAt(i);
              }
              const audioCtx = getPlaybackAudioContext();
              decodeAudioBuffer(audioCtx, byteNumbers.buffer)
                .then((buf) => {
                  preloadedGoodbyeBufferRef.current = buf;
                  console.log("[Zeno] Preloaded goodbye audio decoded and ready in memory.");
                })
                .catch((err) => {
                  console.warn("Failed to decode preloaded goodbye audio:", err);
                });
            } catch (err) {
              console.warn("Error processing preloaded goodbye audio:", err);
            }
          }
          return;
        }

        if (requestId === "preload-greeting" || requestId === "preload-goodbye") {
          return;
        }

        if (
          requestId &&
          requestId !== activeRequestIdRef.current &&
          requestId !== activeAudioRequestIdRef.current &&
          data.type !== "session_reset"
        ) {
          return;
        }

        if (data.type === "assistant_start") {
          hasTriggeredCompletionRef.current = false;
          totalSentencesExpectedRef.current = null;
          stopWordStreamTimer();
          pendingSpeechStreamRef.current = null;
          sentenceTextsRef.current.clear();
          setSpokenBubbles([]);
          setActiveBubbleIndex(0);
          setStreamingBubbleDelta("");
          enqueuedChunkSequencesRef.current?.clear();

          if (!data.is_greeting) {
            setLoading(true);
            loadingRef.current = true;
            // Prime audio queue manager for this incoming response session
            audioQueueManagerRef.current?.startRequest(requestId);
            setCharacterState(ZENO_STATES.THINKING);
            characterStateRef.current = ZENO_STATES.THINKING;

            setMessages((previous) => [
              ...previous,
              {
                id: `assistant-${requestId}`,
                requestId,
                role: "assistant",
                content: "",
                streaming: true,
              },
            ]);
          }
          activeAudioRequestIdRef.current = requestId;
          activeRequestIdRef.current = requestId;
        }

        if (data.type === "assistant_delta") {
          const m = timingMetricsRef.current.get(requestId);
          if (m && m.t_first_delta === null && data.delta) {
            m.t_first_delta = performance.now();
            console.log(`[Zeno Metrics][${requestId}] First text delta displayed at ${(m.t_first_delta - m.t_sent).toFixed(1)}ms`);
          }
          if (!data.is_greeting && data.delta) {
            setMessages((previous) =>
              previous.map((message) =>
                message.id === `assistant-${requestId}`
                  ? {
                    ...message,
                    content: (message.content || "") + data.delta,
                  }
                  : message
              )
            );
          }
        }

        if (data.type === "assistant_sentence") {
          if (data.is_dismissal) {
            isDismissalTurnRef.current = true;
            // User requirement: "in the end we dont need to show the thankyou message in the text ."
            stopWordStreamTimer();
            setSpokenBubbles([]);
            setCurrentSpokenCaption("");
            pendingSpeechStreamRef.current = null;
            return;
          }
          if (!data.is_greeting) {
            const sIdx = typeof data.sentence_index === "number" ? data.sentence_index : 0;
            const cleanMsg = data.spoken_text || data.message || "";

            // Store sentence text for playback synchronization - DO NOT display before audio plays!
            sentenceTextsRef.current.set(sIdx, {
              text: cleanMsg,
              spokenText: data.spoken_text || cleanMsg,
            });

            // If onChunkStart already triggered for this sequence and was waiting for the text
            if (
              pendingSpeechStreamRef.current &&
              pendingSpeechStreamRef.current.sequence === sIdx
            ) {
              const { sequence, duration } = pendingSpeechStreamRef.current;
              pendingSpeechStreamRef.current = null;
              startSpeakingWordStream(sequence, cleanMsg, duration);
            }

            setCurrentSpokenCaption(cleanMsg);
            setMessages((previous) =>
              previous.map((message) => {
                if (message.id === `assistant-${requestId}` && !message.content) {
                  return {
                    ...message,
                    content: data.message,
                  };
                }
                return message;
              })
            );
          }
        }

        if (data.type === "audio_chunk" || data.type === "assistant_audio") {
          if (
            requestId !== activeAudioRequestIdRef.current &&
            requestId !== activeRequestIdRef.current
          ) {
            console.warn(`[Zeno Audio] Dropping audio chunk for mismatched request: ${requestId} (active: ${activeAudioRequestIdRef.current})`);
            return;
          }

          const seq = typeof data.sequence === "number" ? data.sequence : data.sentence_index;
          const chunkKey = `${requestId}:${seq}`;

          // Deduplicate duplicate broadcasts between audio_chunk and assistant_audio
          if (enqueuedChunkSequencesRef.current?.has(chunkKey)) {
            return;
          }
          enqueuedChunkSequencesRef.current?.add(chunkKey);

          const m = timingMetricsRef.current.get(requestId);
          if (m && m.t_first_audio_chunk === null && data.audio) {
            m.t_first_audio_chunk = performance.now();
            console.log(`[Zeno Metrics][${requestId}] First audio chunk received at ${(m.t_first_audio_chunk - m.t_sent).toFixed(1)}ms`);
          }

          console.log(`[Zeno App] Received audio chunk ${seq} (has_audio=${Boolean(data.audio)}) for request ${requestId}`);
          audioQueueManagerRef.current?.enqueueChunk({
            requestId,
            sequence: seq,
            audio: data.audio,
            format: data.format || "mp3",
          });
        }

        if (data.type === "assistant_complete") {
          if (data.is_dismissal) {
            isDismissalTurnRef.current = true;
          }

          const m = timingMetricsRef.current.get(requestId);
          if (m && data.metrics) {
            m.backend_metrics = data.metrics;
          }

          const totalChunks = typeof data.total_chunks === "number"
            ? data.total_chunks
            : data.total_sentences;

          audioQueueManagerRef.current?.setGenerationComplete({
            requestId,
            totalChunks,
          });

          if (!data.is_greeting) {
            setStreamingBubbleDelta("");

            setMessages((previous) =>
              previous.map((message) =>
                message.id === `assistant-${requestId}`
                  ? {
                    ...message,
                    content: data.full_response || message.content,
                    streaming: false,
                    sources: data.sources || { internal: [], web: [] },
                  }
                  : message
              )
            );

            setLoading(false);
            loadingRef.current = false;
          }
        }

        if (data.type === "generation_cancelled") {
          stopAudioPlaybackRef.current?.();
          stopWordStreamTimer();
          pendingSpeechStreamRef.current = null;
          sentenceTextsRef.current.clear();
          setSpokenBubbles([]);
          setStreamingBubbleDelta("");
          setLoading(false);
          activeRequestIdRef.current = null;
          activeAudioRequestIdRef.current = null;
          setCharacterState(ZENO_STATES.IDLE);
          characterStateRef.current = ZENO_STATES.IDLE;
          setMessages((previous) =>
            previous.map((message) =>
              message.streaming ? { ...message, streaming: false } : message
            )
          );
        }

        if (data.type === "error" || data.type === "assistant_error") {
          stopAudioPlaybackRef.current?.();
          setMessages((previous) =>
            previous.map((message) =>
              message.id === `assistant-${requestId}`
                ? {
                  ...message,
                  content: data.message,
                  streaming: false,
                }
                : message
            )
          );

          setLoading(false);
          activeRequestIdRef.current = null;
          activeAudioRequestIdRef.current = null;
          setCharacterState(ZENO_STATES.SAD);
          characterStateRef.current = ZENO_STATES.SAD;

          if (isGreetingTurnRef.current) {
            greetingAudioFinishedRef.current = true;
            checkGreetingComplete();
          }
        }

        if (data.type === "session_reset") {
          stopAudioPlaybackRef.current?.();
          activeRequestIdRef.current = null;
          activeAudioRequestIdRef.current = null;
          setMessages([INITIAL_MESSAGE]);
          setLoading(false);
          setCharacterState(ZENO_STATES.IDLE);
          characterStateRef.current = ZENO_STATES.IDLE;
          setCurrentSpokenCaption("");
        }
      };

      socket.onerror = (err) => {
        console.warn(`[Zeno WebSocket] Socket error on ${targetUrl}:`, err);
        if (!isComponentMountedRef.current) return;
        setConnection("Connection error");
        setLoading(false);
      };

      socket.onclose = (event) => {
        console.warn(`[Zeno WebSocket] Socket closed (${targetUrl}, code=${event.code}). Scheduling auto-reconnect...`);
        if (!isComponentMountedRef.current) return;
        setConnection("Disconnected");
        setLoading(false);
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (!isComponentMountedRef.current) return;
      if (reconnectTimeoutRef.current) return;
      reconnectAttemptRef.current += 1;
      const delay = Math.min(1000 + reconnectAttemptRef.current * 800, 3500);
      console.log(`[Zeno WebSocket] Scheduling auto-reconnect in ${delay}ms...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, delay);
    };

    connectSocketRef.current = connect;
    connect();

    const handleFirstUserInteraction = () => {
      getPlaybackAudioContext();
    };
    window.addEventListener("click", handleFirstUserInteraction, { once: true });
    window.addEventListener("keydown", handleFirstUserInteraction, { once: true });

    return () => {
      isComponentMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      window.removeEventListener("click", handleFirstUserInteraction);
      window.removeEventListener("keydown", handleFirstUserInteraction);
      activeRequestIdRef.current = null;
      activeAudioRequestIdRef.current = null;
      if (currentSocket) {
        try {
          currentSocket.onopen = null;
          currentSocket.onmessage = null;
          currentSocket.onerror = null;
          currentSocket.onclose = null;
          if (
            currentSocket.readyState === WebSocket.OPEN ||
            currentSocket.readyState === WebSocket.CONNECTING
          ) {
            currentSocket.close();
          }
        } catch { }
      }
      cleanupAudioNodes();
      stopAudioPlaybackRef.current?.();
      if (audioQueueManagerRef.current) {
        audioQueueManagerRef.current.stop();
        const ctx = audioQueueManagerRef.current.audioContext;
        if (ctx && ctx.state !== "closed") {
          try {
            ctx.close();
          } catch {
            // Ignore
          }
        }
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (greetingSafetyTimeoutRef.current) clearTimeout(greetingSafetyTimeoutRef.current);
      if (goodbyeSafetyTimeoutRef.current) clearTimeout(goodbyeSafetyTimeoutRef.current);
    };
  }, []);

  const handleFrontendGreeting = (requestId, userText) => {
    // 1. Show user message
    setMessages((previous) => [
      ...previous,
      {
        id: `user-${requestId}`,
        role: "user",
        content: userText,
      },
    ]);

    // 2. Show assistant greeting response
    const replyText = GREETING_TEXT;
    setMessages((previous) => [
      ...previous,
      {
        id: `assistant-${requestId}`,
        role: "assistant",
        content: replyText,
      },
    ]);

    setLoading(false);
    loadingRef.current = false;

    // 3. Switch animation to Talking
    setCharacterState(ZENO_STATES.TALKING);
    characterStateRef.current = ZENO_STATES.TALKING;

    const onEnded = () => {
      stopWordStreamTimer();
      setSpokenBubbles([]);
      if (currentScreenRef.current === "conversation" && !isEndingConversation) {
        setCharacterState(ZENO_STATES.LISTENING);
        characterStateRef.current = ZENO_STATES.LISTENING;
        setTimeout(() => {
          startRecordingRef.current?.();
        }, 200);
      }
    };

    const audioDuration = preloadedGreetingBufferRef.current?.duration || 6.1;
    startSpeakingWordStream(0, replyText, audioDuration, true);
    playStandaloneAudio(greetingAudioSrc, preloadedGreetingBufferRef.current, onEnded);
  };

  const handleFrontendDismissal = (requestId, userText) => {
    // 1. Show user message
    setMessages((previous) => [
      ...previous,
      {
        id: `user-${requestId}`,
        role: "user",
        content: userText,
      },
    ]);

    // 2. Show assistant thank-you / goodbye response
    const replyText = GOODBYE_TEXT;
    setMessages((previous) => [
      ...previous,
      {
        id: `assistant-${requestId}`,
        role: "assistant",
        content: replyText,
      },
    ]);

    setLoading(false);
    loadingRef.current = false;

    // User requirement: "in the end we dont need to show the thankyou message in the text ."
    stopWordStreamTimer();
    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setCurrentSpokenCaption("");

    // 3. Trigger goodbye wave animation and return home (audio plays in lockstep)
    triggerGoodbyeAndReturnHome(replyText);
  };

  const handleStartConversationClick = () => {
    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => { });
      }
    } catch { }
    setStartPromptMessage(null);
    setMicError(null);
    // Display Industry Selection (Step 1)
    setIsIndustryModalOpen(true);
  };

  const handleSelectIndustry = (ind) => {
    console.log("[Zeno] Industry chosen:", ind.name);
    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => { });
      }
    } catch { }
    setSelectedIndustry(ind);
    selectedIndustryRef.current = ind;
    setActiveChallenge(null);
    activeChallengeRef.current = null;
    setHasAskedPrimary(false);
    hasAskedPrimaryRef.current = false;
    setIsIndustryModalOpen(false);
    setCurrentScreen("conversation");
    currentScreenRef.current = "conversation";

    // Ensure any prior recording or audio is stopped
    cancelRecording();
    stopAudioPlayback();
    stopWordStreamTimer();
    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setLoading(false);
    loadingRef.current = false;

    // Step 2: Trigger personalized industry greeting via existing voice pipeline
    triggerIndustryGreeting(ind);
  };

  const handleSelectQuestion = (questionText, challengeId = null) => {
    if (loadingRef.current || isPlayingAudioRef.current || isGreetingTurnRef.current || isEndingConversation) {
      console.log("[Zeno] Question selection blocked: assistant is currently processing or speaking.");
      return;
    }

    // Cancel any active microphone recording session when user clicks a question
    cancelRecording();

    console.log("[Zeno] Question selected:", questionText, "Challenge ID:", challengeId, "Industry:", selectedIndustry?.name);

    if (challengeId && selectedIndustry?.challenges) {
      const found = selectedIndustry.challenges.find((c) => c.id === challengeId);
      if (found) {
        setActiveChallenge(found);
        activeChallengeRef.current = found;
      }
    }

    // Verify WebSocket is open before dispatching
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.warn(
        `[Zeno] Question selection delayed: WebSocket is not open (readyState: ${socketRef.current?.readyState}). Reconnecting...`
      );
      setMicError("Connecting to Zeno voice server... Please tap your question again in a moment.");
      connectSocketRef.current?.(true);
      return;
    }

    // Flag that the primary question has been asked so follow-ups display immediately
    setHasAskedPrimary(true);
    hasAskedPrimaryRef.current = true;

    // Explicitly unlock/resume AudioContext on user gesture
    try {
      const ctx = getPlaybackAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => { });
      }
    } catch { }

    // Keep side questions visible near the toe so user sees the asked question & follow-ups!
    setShowSampleQuestions(true);

    if (currentScreenRef.current !== "conversation") {
      setCurrentScreen("conversation");
      currentScreenRef.current = "conversation";
    }

    sendMessage(questionText, challengeId);
  };

  const sendMessage = (messageText = input, challengeId = null) => {
    const text = messageText.trim();

    if (!text) {
      return;
    }

    getPlaybackAudioContext();
    stopAudioPlayback();
    stopWordStreamTimer();
    pendingSpeechStreamRef.current = null;
    sentenceTextsRef.current.clear();

    const requestId = createRequestId();
    activeRequestIdRef.current = requestId;
    activeAudioRequestIdRef.current = requestId;
    audioQueueManagerRef.current?.startRequest(requestId);
    hasTriggeredCompletionRef.current = false;

    // Fast-path 1: Greeting messages ("hi", "hello", "hey", etc.)
    // Respond directly from frontend with zero latency, do NOT send to backend!
    if (isGreetingText(text)) {
      console.log("[Zeno Frontend] Handled greeting locally with zero latency:", text);
      handleFrontendGreeting(requestId, text);
      setInput("");
      return;
    }

    // Fast-path 2: Dismissal / Goodbye messages ("no", "thank you", "thanks", "nope", etc.)
    // Respond directly from frontend, wave goodbye and return home, do NOT send to backend!
    if (isNegativeDismissalText(text)) {
      console.log("[Zeno Frontend] Handled dismissal / goodbye locally:", text);
      handleFrontendDismissal(requestId, text);
      setInput("");
      return;
    }

    // Normal substantive questions -> Sent to backend!
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.warn(
        `[Zeno] Cannot send message: WebSocket is not open (readyState: ${socketRef.current?.readyState}). Triggering immediate reconnection...`
      );
      setMicError("Connecting to Zeno voice server... Please tap your question again in a moment.");
      connectSocketRef.current?.(true);
      return;
    }

    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setActiveBubbleIndex(0);

    timingMetricsRef.current.set(requestId, {
      requestId,
      t_sent: performance.now(),
      t_first_delta: null,
      t_first_audio_chunk: null,
      t_first_audio_playback: null,
      t_last_audio_playback: null,
      backend_metrics: null,
    });

    setMessages((previous) => [
      ...previous,
      {
        id: `user-${requestId}`,
        role: "user",
        content: text,
      },
    ]);

    setLoading(true);
    loadingRef.current = true;
    setCharacterState(ZENO_STATES.THINKING);
    characterStateRef.current = ZENO_STATES.THINKING;

    let activeChId = challengeId || activeChallengeRef.current?.id || null;

    // If active challenge not explicitly set, find matching challenge or default to first challenge
    if (!activeChId && selectedIndustry?.challenges?.length) {
      const lower = text.toLowerCase();
      const matched = selectedIndustry.challenges.find((c) => {
        const qMatch = c.question && lower.includes(c.question.toLowerCase().slice(0, 15));
        const tMatch = c.title && lower.includes(c.title.toLowerCase());
        const idMatch = c.id && lower.includes(c.id.replace(/_/g, " "));
        return qMatch || tMatch || idMatch;
      }) || selectedIndustry.challenges[0];

      if (matched) {
        activeChId = matched.id;
        setActiveChallenge(matched);
        activeChallengeRef.current = matched;
      }
    }

    // Trigger sequential "What Zeno does on screen" action steps for this question
    triggerThinkingSteps(text, activeChId);

    socketRef.current.send(
      JSON.stringify({
        type: "user_message",
        request_id: requestId,
        message: text,
        industry: selectedIndustry?.name || null,
        challenge_id: activeChId,
      })
    );

    setInput("");
  };

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  const resetConversation = () => {
    clearThinkingSteps();
    setActiveThinkingSteps([]);
    setActiveThinkingStepIndex(0);
    cancelRecording();
    discardAudio();
    stopAudioPlayback();
    stopWordStreamTimer();
    pendingSpeechStreamRef.current = null;
    sentenceTextsRef.current.clear();
    activeRequestIdRef.current = null;
    activeAudioRequestIdRef.current = null;
    setLoading(false);
    setCharacterState(ZENO_STATES.IDLE);
    characterStateRef.current = ZENO_STATES.IDLE;
    setCurrentSpokenCaption("");
    setSpokenBubbles([]);
    setStreamingBubbleDelta("");
    setActiveBubbleIndex(0);
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setLiveTranscript("");
    isDismissalTurnRef.current = false;

    if (goodbyeSafetyTimeoutRef.current) {
      clearTimeout(goodbyeSafetyTimeoutRef.current);
      goodbyeSafetyTimeoutRef.current = null;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "reset_session" })
      );
    }
  };

  const renderAudioSettingsPopover = () => {
    if (!isAudioSettingsOpen) return null;
    return (
      <div className="audio-settings-popover" role="dialog" aria-label="Audio Output Settings">
        <div className="audio-popover-header">
          <span className="audio-popover-title">🎧 Audio Output Settings</span>
          <button
            type="button"
            className="audio-popover-close"
            onClick={() => setIsAudioSettingsOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="audio-popover-body">
          <label className="audio-label" htmlFor="audio-sink-select">
            Playback Device:
          </label>
          <select
            id="audio-sink-select"
            className="audio-sink-select"
            value={selectedSinkId}
            onChange={(e) => handleAudioSinkChange(e.target.value)}
          >
            <option value="default">Default System Audio</option>
            {audioOutputDevices.map((device, idx) => (
              <option key={device.deviceId || idx} value={device.deviceId}>
                {device.label || `Audio Output Device ${idx + 1}`}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`audio-test-btn ${isTestingAudio ? "testing" : ""}`}
            onClick={handleTestAudio}
          >
            {isTestingAudio ? "🔊 Playing Test Chime..." : "▶ Test Audio Output"}
          </button>

          <div className="audio-popover-hint">
            <strong>💡 Using Earphones on an HDMI Screen?</strong>
            <p>
              Windows automatically redirects audio to your HDMI display when connected.
              To hear through earphones: click the <strong>Speaker icon in your Windows Taskbar</strong> (bottom-right of your screen) and select your <strong>Headphones/Earphones</strong> device.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // RENDER: Mobile Web Form (Opened when visitor scans event QR code)
  // -------------------------------------------------------------
  const isMobileDemoForm =
    typeof window !== "undefined" &&
    (window.location.pathname === "/demo-request" ||
      window.location.pathname.startsWith("/demo-request") ||
      new URLSearchParams(window.location.search).has("demo") ||
      new URLSearchParams(window.location.search).get("view") === "demo-request");

  if (isMobileDemoForm) {
    return <DemoRequestMobileForm />;
  }

  // -------------------------------------------------------------
  // RENDER: Initial Start Screen (PART 3)
  // -------------------------------------------------------------
  if (currentScreen === "start") {
    return (
      <main className="hologram-stage-root start-screen-mode">
        {/* Top Header Bar with Brand Title */}
        <header className="hologram-header start-header">
          <div
            className={`status-pill ${connection !== "Connected" ? "clickable" : ""}`}
            onClick={() => {
              if (connection !== "Connected") {
                console.log("[Zeno] User triggered manual reconnection.");
                connectSocketRef.current?.(true);
              }
            }}
            title={
              connection === "Connected"
                ? "Status: Connected"
                : `Status: ${connection} (Click to Reconnect)`
            }
            aria-label={`Status: ${connection}`}
          >
            <span
              className={`status-dot ${connection === "Connected" ? "online" : connection === "Connecting..." ? "connecting" : ""}`}
            />
            {connection !== "Connected" && (
              <span className="status-reconnect-badge">
                {connection === "Connecting..." ? "Connecting..." : "Reconnect"}
              </span>
            )}
          </div>

          <div className="center-header-title">
            <span className="header-brand-name">ZENO</span>
            <span className="header-brand-sub">Netcore AI Ambassador</span>
          </div>

          <div className="header-right-actions">
            <button
              type="button"
              className="fullscreen-toggle-btn"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen for HoloBox"
              aria-label="Toggle Fullscreen"
            >
              ⛶
            </button>
          </div>
        </header>

        {/* Hero Character Section: ONLY the avatar in the center */}
        <section className="hologram-hero-area home-hero-area">
          <div className="character-stage-wrapper">
            <ZenoCharacter
              state={characterState}
              size="hero"
              onEnded={handleCharacterEnded}
            />
          </div>
        </section>

        {/* Bottom Bar: Start Conversation Button */}
        <footer className="start-screen-footer">
          {startPromptMessage && (
            <div className="prompt-toast animate-slide-up" role="alert">
              <span className="toast-icon">💡</span>
              <span>{startPromptMessage}</span>
            </div>
          )}

          {micError && (
            <div className="mic-alert-banner" role="alert">
              <span>⚠️ {micError}</span>
              <button
                type="button"
                className="alert-dismiss-btn"
                onClick={() => setMicError(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div className="start-actions-bar">
            <button
              type="button"
              className="hero-start-btn"
              onClick={handleStartConversationClick}
              disabled={connection !== "Connected"}
              aria-label="Start Conversation with Zeno"
            >
              <span>Start</span>
            </button>
          </div>
        </footer>

        <IndustryModal
          isOpen={isIndustryModalOpen}
          onClose={() => setIsIndustryModalOpen(false)}
          industries={industries}
          selectedIndustry={selectedIndustry}
          onSelectIndustry={handleSelectIndustry}
        />
      </main>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Active Conversation Screen
  // -------------------------------------------------------------
  const isGoodbye = isEndingConversation || characterState === ZENO_STATES.GOODBYE || isDismissalTurnRef.current;
  const isAnswering = loading || isPlayingAudio || isGreetingActive || isGoodbye;
  const isShiftedLeft = showSampleQuestions && selectedIndustry && !isAnswering && !isGoodbye;

  return (
    <main
      className={`hologram-stage-root active-conversation-mode ${isPlayingAudio || isGreetingActive ? "is-speaking-active" : ""}`}
    >
      {/* Top Bar: Title & Connection */}
      <header className="hologram-header active-header">
        <div
          className={`status-pill ${connection !== "Connected" ? "clickable" : ""}`}
          onClick={() => {
            if (connection !== "Connected") {
              console.log("[Zeno] User triggered manual reconnection.");
              connectSocketRef.current?.(true);
            }
          }}
          title={
            connection === "Connected"
              ? "Status: Connected"
              : `Status: ${connection} (Click to Reconnect)`
          }
          aria-label={`Status: ${connection}`}
        >
          <span
            className={`status-dot ${connection === "Connected" ? "online" : connection === "Connecting..." ? "connecting" : ""}`}
          />
          {connection !== "Connected" && (
            <span className="status-reconnect-badge">
              {connection === "Connecting..." ? "Connecting..." : "Reconnect"}
            </span>
          )}
        </div>

        <div className="center-header-title">
          <span className="header-brand-name">ZENO</span>
          <span className="header-brand-sub">Netcore AI Ambassador</span>
        </div>

        <div className="header-right-actions">
          <button
            type="button"
            className="fullscreen-toggle-btn"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen for HoloBox"
            aria-label="Toggle Fullscreen"
          >
            ⛶
          </button>

          <button
            type="button"
            className={`toggle-chat-pill icon-only-pill ${isChatOpen ? "active" : ""}`}
            onClick={() => setIsChatOpen((prev) => !prev)}
            title={isChatOpen ? "Close chat transcript" : "Open chat transcript"}
            aria-label="Chat"
          >
            <span>💬</span>
          </button>
        </div>
      </header>

      {/* Primary Character Stage: Moves left when side questions are visible, centers when answering */}
      <section className={`hologram-main-stage ${isShiftedLeft ? "layout-split" : "layout-centered"}`}>
        <div
          className={`stage-interactive-container ${isShiftedLeft ? "avatar-shifted" : "avatar-centered"} ${isPlayingAudio || isGreetingActive ? "avatar-speaking-down" : ""}`}
        >
          <div className="character-stage-wrapper">
            <ZenoCharacter
              state={characterState}
              size="hero"
              onEnded={handleCharacterEnded}
            />
            <SpeechBubbles3D
              bubbles={isEndingConversation || isDismissalTurnRef.current ? [] : spokenBubbles}
              activeBubbleIndex={activeBubbleIndex}
              streamingText={isEndingConversation || isDismissalTurnRef.current ? "" : streamingBubbleDelta}
              isPlayingAudio={isPlayingAudio}
              isThinking={
                loading &&
                spokenBubbles.length === 0 &&
                !streamingBubbleDelta &&
                !isPlayingAudio &&
                characterState !== ZENO_STATES.TALKING
              }
              isGreeting={isGreetingActive || isGreetingTurnRef.current}
              thinkingSteps={activeThinkingSteps}
              currentThinkingStepIndex={activeThinkingStepIndex}
            />
          </div>

          {/* Industry Challenges & Follow-up Questions Displayed in the Right Center */}
          {isShiftedLeft && (
            <div className="side-sample-questions-wrap animate-fade-in-right">
              <SuggestedQuestions
                industry={selectedIndustry}
                activeChallenge={activeChallenge}
                hasAskedPrimary={hasAskedPrimary}
                onSelectQuestion={handleSelectQuestion}
                onSelectChallenge={(ch) => {
                  setActiveChallenge(ch);
                  activeChallengeRef.current = ch;
                  setHasAskedPrimary(false);
                  hasAskedPrimaryRef.current = false;
                }}
                onResetChallenge={() => {
                  setActiveChallenge(null);
                  activeChallengeRef.current = null;
                  setHasAskedPrimary(false);
                  hasAskedPrimaryRef.current = false;
                }}
                onChangeIndustry={() => setIsIndustryModalOpen(true)}
                onOpenWhatsAppLead={(ctx) => {
                  setLeadContext({
                    industry: ctx?.industry || selectedIndustry?.name || "Banking & Fintech",
                  });
                  setIsWhatsAppQROpen(true);
                }}
                disabled={isAnswering}
              />
            </div>
          )}
        </div>

        {/* Dynamic Assistant State Pill directly below the Character */}
        <div className="assistant-state-row" aria-live="polite">
          {isEndingConversation ? (
            <div className="state-badge goodbye">
              <span>👋 Goodbye!</span>
            </div>
          ) : isGreetingActive ? (
            <div className="state-badge talking">
              <span className="pulsing-dot blue" />
              <span>Welcoming you...</span>
            </div>
          ) : isRecording ? (
            <div className="state-badge listening">
              <span className="pulsing-dot green" />
              <span>I'm listening...</span>
            </div>
          ) : loading ? (
            <div className="state-badge thinking">
              <span className="pulsing-dot purple" />
              <span>
                {activeThinkingSteps[activeThinkingStepIndex] || "Zeno is analyzing..."}
              </span>
            </div>
          ) : isPlayingAudio ? (
            <div className="state-badge talking">
              <span className="pulsing-dot blue" />
              <span>Speaking...</span>
            </div>
          ) : (
            <div className="state-badge ready">
              <span className="pulsing-dot orange" />
              <span>I'm listening... Ask a question or tap mic</span>
            </div>
          )}
        </div>

        {/* Live Speech / Spoken Sentence Caption below Status */}
        <div className="speech-caption-area">
          {isRecording && (
            <div className="live-caption-dock animate-fade-in">
              <div className="waveform-inline" aria-hidden="true">
                {[0.5, 0.8, 1.2, 1.0, 1.3, 0.9, 0.7, 0.4].map((mult, idx) => {
                  const scaledHeight = Math.max(
                    4,
                    Math.min(24, Math.round((liveAudioLevel / 100) * 24 * mult))
                  );
                  return (
                    <span
                      key={idx}
                      className={`wave-bar ${vadStatus === "speaking" ? "active" : ""}`}
                      style={{ height: `${scaledHeight}px` }}
                    />
                  );
                })}
              </div>
              <span className="caption-text">
                {liveTranscript ? `"${liveTranscript}"` : "Listening to your voice..."}
              </span>
            </div>
          )}
        </div>

        {/* Central Controls: [ Microphone / End Conversation ] */}
        <div className="central-controls-row">
          <button
            type="button"
            className={`grand-mic-button ${isRecording
              ? "recording pulse-ring"
              : (isPlayingAudio || isGreetingActive)
                ? "speaking-interrupt"
                : "ready-mic"
              }`}
            onClick={handleToggleMic}
            disabled={connection !== "Connected" || isEndingConversation}
            title={
              isRecording
                ? "Turn off microphone / submit"
                : (isPlayingAudio || isGreetingActive)
                  ? "Interrupt speech"
                  : "Click to speak"
            }
            aria-label="Microphone"
          >
            {isRecording ? "⏹" : (isPlayingAudio || isGreetingActive) ? "⏸" : "🎙️"}
          </button>

          <button
            type="button"
            className="end-convo-pill"
            onClick={handleEndConversation}
            disabled={isEndingConversation}
            title="End conversation"
          >
            {isEndingConversation ? "Ending..." : "End Conversation"}
          </button>
        </div>

        {micError && (
          <div className="mic-alert-banner conversation-alert" role="alert">
            <span>⚠️ {micError}</span>
            <div className="alert-actions">
              <button
                type="button"
                className="retry-pill"
                onClick={() => {
                  setMicError(null);
                  startRecording();
                }}
              >
                Retry
              </button>
              <button
                type="button"
                className="dismiss-pill"
                onClick={() => setMicError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Slide-over Chat Drawer (When [ Show Chat ] is Open) */}
      <aside className={`chat-drawer-panel ${isChatOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3>Conversation Transcript</h3>
            <span className="drawer-count">{messages.length} messages</span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setIsChatOpen(false)}
            aria-label="Close Chat"
          >
            ✕
          </button>
        </div>

        <div className="drawer-chat-window" ref={chatWindowRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`drawer-message ${message.role}`}
            >
              <div className="msg-author">
                {message.role === "user" ? "You" : "Zeno"}
              </div>
              <div className="msg-content">
                {renderFormattedContent(message.content)}
                {message.streaming ? " ▍" : ""}
              </div>
              {!message.streaming && message.sources && (
                <SourcesSection
                  sources={message.sources}
                  messageId={message.id}
                />
              )}
            </div>
          ))}

          {isPlayingAudio ? (
            <div className="drawer-stream-status speaking">
              🔊 Zeno is speaking...
            </div>
          ) : loading ? (
            <div className="drawer-stream-status">
              ⏳ {activeThinkingSteps[activeThinkingStepIndex] || "Zeno is analyzing..."}
            </div>
          ) : null}
        </div>

        <div className="drawer-input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (isRecording) stopAndSubmit();
                else sendMessage();
              }
            }}
            placeholder="Type your question..."
            disabled={connection !== "Connected" || isEndingConversation}
          />
          <button
            type="button"
            className="drawer-send-btn"
            onClick={() => (isRecording ? stopAndSubmit() : sendMessage())}
            disabled={
              (!input.trim() && !liveTranscript.trim()) ||
              connection !== "Connected" ||
              isEndingConversation
            }
          >
            Send
          </button>
        </div>

        <div className="drawer-footer-actions">
          <button
            type="button"
            className="drawer-reset-btn"
            onClick={resetConversation}
            disabled={isEndingConversation}
          >
            Reset History
          </button>
        </div>
      </aside>

      <IndustryModal
        isOpen={isIndustryModalOpen}
        onClose={() => {
          setIsIndustryModalOpen(false);
          if (!selectedIndustryRef.current) {
            returnToHomePage();
          }
        }}
        industries={industries}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={handleSelectIndustry}
      />

      {/* Dedicated WhatsApp QR Code Lead Capture Screen */}
      <WhatsAppQRModal
        isOpen={isWhatsAppQROpen}
        onClose={() => setIsWhatsAppQROpen(false)}
        industryName={leadContext.industry}
      />

      {/* Admin Leads & Demo Requests Dashboard */}
      <AdminLeadsDashboard
        isOpen={isAdminLeadsOpen}
        onClose={() => setIsAdminLeadsOpen(false)}
      />
    </main>
  );
}

export default App;
