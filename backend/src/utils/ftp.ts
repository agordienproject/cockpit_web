import { Client } from 'basic-ftp';
import { Writable } from 'stream';

const FTP_HOST = process.env.FTP_HOST || '';
const FTP_PORT = process.env.FTP_PORT ? parseInt(process.env.FTP_PORT, 10) : 21;
const FTP_USER = process.env.FTP_USER || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '';
const FTP_SECURE = (process.env.FTP_SECURE || 'false').toLowerCase() === 'true';

export async function withFtpClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: FTP_HOST,
      port: FTP_PORT,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: FTP_SECURE,
    });
    return await fn(client);
  } finally {
    client.close();
  }
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const VIDEO_EXTS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
const PLY_EXT = '.ply';

export function isImage(name: string) {
  const lower = name.toLowerCase();
  return IMAGE_EXTS.some(ext => lower.endsWith(ext));
}

export function isVideo(name: string) {
  const lower = name.toLowerCase();
  return VIDEO_EXTS.some(ext => lower.endsWith(ext));
}

export function isMedia(name: string) {
  return isImage(name) || isVideo(name);
}

export function isPlyCleaned(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith('_cleaned.ply');
}

function extractFtpPath(folderPath: string) {
  try {
    // Node's URL can parse ftp scheme; take only the pathname
    const u = new URL(folderPath);
    if (u.protocol.startsWith('ftp')) {
      return decodeURIComponent(u.pathname).replace(/^\/+/, '');
    }
  } catch {}
  // Fallback: strip ftp://, host and leading slash
  const raw = folderPath.replace(/^ftp:\/\//i, '').replace(/^[^/]+\//, '').replace(/^\/+/, '');
  if (raw.includes('..')) throw new Error('Invalid folder path');
  return raw;
}

export async function listImageFiles(folderPath: string) {
  return await withFtpClient(async (client) => {
    console.log("Extracting FTP path from folderPath:", folderPath);
    const path = extractFtpPath(folderPath);
    const list = await client.list(path);
    return list
      .filter(item => item.isFile && isImage(item.name))
      .map(item => ({ name: item.name, size: item.size }));
  });
}

export async function listMediaFiles(folderPath: string) {
  return await withFtpClient(async (client) => {
    const path = extractFtpPath(folderPath);
    const list = await client.list(path);
    return list
      .filter(item => item.isFile && isMedia(item.name))
      .map(item => ({ name: item.name, size: item.size, type: isImage(item.name) ? 'image' : 'video' }));
  });
}

export async function listPlyCleanedFiles(folderPath: string) {
  return await withFtpClient(async (client) => {
    const base = extractFtpPath(folderPath);
    const out: Array<{ name: string; size: number; type: 'ply'; relativePath: string }> = [];
    const list = await client.list(base);
    for (const item of list) {
      if (item.isFile && isPlyCleaned(item.name)) {
        out.push({ name: item.name, size: item.size, type: 'ply', relativePath: item.name });
      } else if (item.isDirectory) {
        const subdir = `${base}/${item.name}`;
        try {
          const sublist = await client.list(subdir);
          for (const sub of sublist) {
            if (sub.isFile && isPlyCleaned(sub.name)) {
              out.push({ name: sub.name, size: sub.size, type: 'ply', relativePath: `${item.name}/${sub.name}` });
            }
          }
        } catch {
          // ignore inaccessible directories
        }
      }
    }
    return out;
  });
}

export async function getImageStream(folderPath: string, fileName: string, writable: NodeJS.WritableStream) {
  return await withFtpClient(async (client) => {
    const base = extractFtpPath(folderPath);
    const full = base.endsWith('/') ? `${base}${fileName}` : `${base}/${fileName}`;
    await client.downloadTo(writable as any, full);
  });
}

export async function getFileStream(folderPath: string, fileName: string, writable: NodeJS.WritableStream) {
  return await withFtpClient(async (client) => {
    const base = extractFtpPath(folderPath);
    const full = base.endsWith('/') ? `${base}${fileName}` : `${base}/${fileName}`;
    await client.downloadTo(writable as any, full);
  });
}

export async function fileExists(folderPath: string, fileName: string) {
  return await withFtpClient(async (client) => {
    const base = extractFtpPath(folderPath);
    const dir = base.replace(/\/+$/, '');
    const list = await client.list(dir);
    return list.some(item => item.isFile && item.name === fileName);
  });
}

class BufferWritable extends Writable {
  private chunks: Buffer[] = [];
  _write(chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback();
  }
  getBuffer() {
    return Buffer.concat(this.chunks);
  }
}

export async function getTextFile(folderPath: string, fileName: string, encoding: BufferEncoding = 'utf-8') {
  return await withFtpClient(async (client) => {
    const base = extractFtpPath(folderPath);
    const full = base.endsWith('/') ? `${base}${fileName}` : `${base}/${fileName}`;
    const sink = new BufferWritable();
    await client.downloadTo(sink as any, full);
    return sink.getBuffer().toString(encoding);
  });
}
