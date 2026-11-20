export function downsampleTo24k(buffer, sampleRate) {
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

export function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

export function decodeAudioBuffer(audioCtx, arrayBuffer) {
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

export function getSupportedMimeType() {
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

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
