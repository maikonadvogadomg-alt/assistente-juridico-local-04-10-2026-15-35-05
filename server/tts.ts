/**
 * Voz "Francisca" (Microsoft Edge, grátis, precisa de internet).
 * 1º direto pelo Node (pacote msedge-tts) — funciona no Windows sem instalar nada.
 * 2º pelo Python (python -m edge_tts), como era na Replit.
 */
import os from "os";
import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

export async function edgeTts(text: string, voice = "pt-BR-FranciscaNeural"): Promise<Buffer | null> {
  try {
    const mod: any = await import("msedge-tts");
    const tts = new mod.MsEdgeTTS();
    await tts.setMetadata(voice, mod.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const out: any = tts.toStream(text);
    const stream: NodeJS.ReadableStream = out && out.audioStream ? out.audioStream : out;
    const buf = await new Promise<Buffer>((resolve, reject) => {
      const parts: Buffer[] = [];
      const timer = setTimeout(() => reject(new Error("tempo esgotado")), 45000);
      stream.on("data", (c: Buffer) => parts.push(Buffer.from(c)));
      stream.on("end", () => { clearTimeout(timer); resolve(Buffer.concat(parts)); });
      stream.on("close", () => { clearTimeout(timer); resolve(Buffer.concat(parts)); });
      stream.on("error", (e: Error) => { clearTimeout(timer); reject(e); });
    });
    try { tts.close?.(); } catch {}
    if (buf.length > 100) return buf;
  } catch { /* tenta o Python */ }

  const stamp = Date.now() + "_" + Math.random().toString(36).slice(2);
  const txtFile = path.join(os.tmpdir(), `tts_in_${stamp}.txt`);
  const mp3File = path.join(os.tmpdir(), `tts_out_${stamp}.mp3`);
  try {
    await fs.writeFile(txtFile, text, "utf8");
    const py = process.platform === "win32" ? "python" : "python3";
    await promisify(execFile)(py, ["-m", "edge_tts", "--file", txtFile, "--voice", voice, "--write-media", mp3File], { timeout: 45000 });
    return await fs.readFile(mp3File);
  } catch {
    return null;
  } finally {
    fs.unlink(txtFile).catch(() => {});
    fs.unlink(mp3File).catch(() => {});
  }
}
