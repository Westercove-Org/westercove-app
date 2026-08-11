/**
 * Hermes' TextDecoder only knows utf-8, but jsPDF constructs a latin1 decoder
 * while loading. Latin-1 maps each byte straight to the code point of the same
 * value, so a tiny decoder covers it. Must be imported before jspdf.
 */
const LATIN1 = new Set(['latin1', 'binary', 'iso-8859-1', 'windows-1252']);

const NativeTextDecoder = globalThis.TextDecoder;

class Latin1TextDecoder {
  readonly encoding = 'windows-1252';
  readonly fatal = false;
  readonly ignoreBOM = false;

  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (!input) return '';
    const bytes =
      input instanceof Uint8Array
        ? input
        : new Uint8Array(ArrayBuffer.isView(input) ? input.buffer : input);
    let out = '';
    // chisle: chunked to stay under the argument limit on big buffers
    for (let i = 0; i < bytes.length; i += 8192) {
      out += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return out;
  }
}

globalThis.TextDecoder = function TextDecoder(label?: string, options?: unknown) {
  if (label && LATIN1.has(label.toLowerCase())) return new Latin1TextDecoder();
  return new NativeTextDecoder(label, options as never);
} as unknown as typeof globalThis.TextDecoder;
