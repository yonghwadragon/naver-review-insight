// frontend/utils/audio-utils.ts

export type GenAIBlob = {
  data: string;
  mimeType: string;
};

export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Uint8Array(Int16 PCM) -> Float32
  const dataInt16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(dataInt16.length);

  for (let i = 0; i < dataInt16.length; i++) {
    float32[i] = dataInt16[i] / 32768.0;
  }

  return float32;
}

export async function decodeAudioData(
  base64: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const float32Data = base64ToFloat32Array(base64);
  const buffer = ctx.createBuffer(1, float32Data.length, sampleRate);
  buffer.getChannelData(0).set(float32Data);
  return buffer;
}

export function float32ToPcm16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);

  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return int16;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

export function createPcmBlob(data: Float32Array): GenAIBlob {
  const int16 = float32ToPcm16(data);

  return {
     data: arrayBufferToBase64(int16.buffer as ArrayBuffer),
    mimeType: "audio/pcm;rate=16000",
  };
}
