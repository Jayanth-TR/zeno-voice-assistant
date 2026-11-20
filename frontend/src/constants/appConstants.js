// Text & timing constants
export const WELCOME_TEXT = "Welcome to Netcore. I am Zeno, your AI Brand Ambassador.";
export const GREETING_TEXT = "Hey! I am Zeno, your AI Assistant. Please select your industry, and then let's clarify your questions.";

export const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content: GREETING_TEXT,
};

// Configurable no-speech timeout in milliseconds (8 seconds)
export const NO_SPEECH_TIMEOUT_MS = 8000;
export const GOODBYE_TEXT = "Thank you! It was great chatting with you. Have a wonderful day!";

// Dismissal detection (when user says No, Nope, That's all, Nothing, Thank you, etc.)
export const DISMISSAL_REGEX = /^\s*(no|nope|nah|nay|that'?s?\s*(all|it)|that\s+is\s+(all|it)|that\s+will\s+be\s+all|nothing(\s+else)?|(im|i\s+am)\s+good|all\s+good|(im|i\s+am)\s+fine|bye|goodbye|done|not\s+really|not\s+right\s+now|thank\s*you|thanks|(i\s*dont|i\s*do\s*not)\s+have\s+(any|more|other)\s+questions?)\b/i;

export function isNegativeDismissalText(text) {
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
export const GREETING_REGEX = /^\s*(hi|hello|hey|greetings|howdy|good\s+(morning|afternoon|evening|day)|whats\s*up|what\s+is\s+up)(\s+(zeno|there|bot|buddy|friend))?[!.,?]*\s*$/i;

export function isGreetingText(text) {
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
