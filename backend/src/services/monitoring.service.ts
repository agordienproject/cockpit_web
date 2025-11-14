import fs from 'fs/promises';
import path from 'path';
import { info } from '../utils/logger';

const targetsDir = process.env.METRICS_TARGETS_DIR || path.resolve(__dirname, '../../../data/metrics/targets');
const WINDOWS_FILE = process.env.WINDOWS_TARGETS_FILE || 'windows_exporter.json';
const LINUX_FILE = process.env.LINUX_TARGETS_FILE || 'linux_exporter.json';

const fileForOs = (os: string) => {
    const key = (os || '').toLowerCase();
    if (key.startsWith('win')) return WINDOWS_FILE;
    if (key.startsWith('lin')) return LINUX_FILE;
    // default windows if unknown
    return WINDOWS_FILE;
};

type TargetGroup = { targets: string[]; labels?: Record<string, string> };

const readJson = async (fullPath: string): Promise<TargetGroup[]> => {
    try {
        const raw = await fs.readFile(fullPath, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data as TargetGroup[];
        return [];
    } catch (e: any) {
        // If file does not exist, start empty
        if (e?.code === 'ENOENT') return [];
        throw e;
    }
};

const atomicWrite = async (fullPath: string, content: string) => {
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const tmp = fullPath + '.tmp';
    await fs.writeFile(tmp, content, 'utf-8');
    await fs.rename(tmp, fullPath);
};

export const addFileSdTarget = async (os: string, address: string, labels?: Record<string, string>) => {
    const file = fileForOs(os);
    const fullPath = path.resolve(targetsDir, file);
    const groups = await readJson(fullPath);

    // Deduplicate: if target already exists, update labels if provided
    const normalized = address.trim();
    let found = false;
    const updated = groups.map((g) => {
        if (Array.isArray(g.targets) && g.targets.includes(normalized)) {
            found = true;
            return { targets: g.targets, labels: { ...(g.labels || {}), ...(labels || {}) } };
        }
        return g;
    });
    if (!found) {
        updated.push({ targets: [normalized], labels: labels || {} });
    }
    await atomicWrite(fullPath, JSON.stringify(updated, null, 2));
    return { ok: true, file: fullPath };
};

export const testExporterUrl = async (url: string) => {
    info('monitoring.testExporterUrl - testing', { url });
    const base = url.trim().replace(/^http:\/\//, '').replace(/^https:\/\//, '');
    const httpUrl = `http://${base}`;
    const endpoints = ['/health', '/metrics', '/'];
    for (const ep of endpoints) {
        try {
            const r = await fetch(httpUrl + ep, { method: 'GET' as any, headers: { Accept: 'text/plain,*/*' }, cache: 'no-store' });
            if (r.ok) {
                info('monitoring.testExporterUrl - success', { url: httpUrl + ep, status: r.status });
                return { ok: true, url: httpUrl + ep, status: r.status };
            }
        } catch { }
    }
    return { ok: false, url: httpUrl, status: 0 };
};

// HTTP SD endpoint data builder from DB is implemented in route (to avoid Prisma here)
export default { addFileSdTarget, testExporterUrl };
