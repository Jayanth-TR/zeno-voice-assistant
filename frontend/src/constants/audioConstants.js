import greetingAudioSrc from "../assets/audio/greeting.mp3";
import goodbyeAudioSrc from "../assets/audio/goodbye.mp3";
import ecommerceGreetingAudio from "../assets/audio/greeting_ecommerce.mp3";
import bankingGreetingAudio from "../assets/audio/greeting_banking.mp3";
import insuranceGreetingAudio from "../assets/audio/greeting_insurance.mp3";

export {
  greetingAudioSrc,
  goodbyeAudioSrc,
  ecommerceGreetingAudio,
  bankingGreetingAudio,
  insuranceGreetingAudio,
};

export const BUNDLED_INDUSTRY_GREETINGS = {
  ecommerce: ecommerceGreetingAudio,
  banking: bankingGreetingAudio,
  insurance: insuranceGreetingAudio,
};

// Voice Activity Detection (VAD) parameters
export const VAD_CONFIG = {
  speechThreshold: 14,
  rmsThreshold: 0.015,
  silenceDurationMs: 2400, // Natural pause tolerance (2.4s) so multi-point questions aren't prematurely cut off
  minSpeechDurationMs: 250,
  maxRecordingDurationMs: 60000,
  smoothingTimeConstant: 0.25,
  fftSize: 512,
};

export const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
export const wsProtocol = isSecure ? "wss:" : "ws:";
export const currentHost =
  typeof window !== "undefined" && window.location.host
    ? window.location.host
    : "localhost:5173";

export function getVoiceWsUrls() {
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
export const TRANSCRIBE_WS_URL = `${wsProtocol}//${currentHost}/ws/transcribe`;
export const VOICE_WS_URL = `${wsProtocol}//${currentHost}/ws/voice`;
export const API_BASE_URL =
  typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "http://localhost:5173";
