import fs from 'fs/promises';
import path from 'path';
import { prismaPSQL } from '../prisma/client_psql';
import { decryptConnection } from '../utils/crypto';
import { info, error as logError } from '../utils/logger';

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
        updated.push({
            targets: [normalized],
            labels: labels
        });
    }

    await atomicWrite(fullPath, JSON.stringify(updated, null, 2));
};

// --- Database & Machine HTTP SD Services ---

export const getMachineTargets = async () => {
    const machines: any[] = await prismaPSQL.dIM_MACHINE.findMany({ where: { deleted: false } });
    const osIds = [...new Set(machines.map(m => (m as any).id_os_machine).filter(Boolean))];
    const osMap: Record<string, string> = {};
    
    if (osIds.length) {
        const osRefs: any[] = await prismaPSQL.rEF_OS_MACHINE.findMany({ where: { id_os_machine: { in: osIds as any }, deleted: false } as any });
        osRefs.forEach(r => { osMap[String(r.id_os_machine)] = r.name_os_machine || ''; });
    }

    return machines
        .filter((m) => !!m.url_metrics_machine)
        .map((m) => {
            const idOs = (m as any).id_os_machine;
            const osName = idOs ? osMap[String(idOs)] || '' : '';
            
            // Clean URL: remove protocol and path, keep only host:port
            let cleanUrl = String(m.url_metrics_machine).trim();
            cleanUrl = cleanUrl.replace(/^https?:\/\//i, ''); // Remove http:// or https://
            cleanUrl = cleanUrl.replace(/\/.*$/, ''); // Remove everything after first /
            
            return {
                targets: [cleanUrl],
                labels: {
                    instance: cleanUrl,
                    machine: String(m.name_machine || m.id_machine),
                    hostname: String(m.name_machine || m.id_machine),
                    os: (osName ? osName.toLowerCase() : ''),
                },
            };
        });
};

const getDbTargets = async (typeRegex: RegExp, typeLabel: string) => {
    const dbs: any[] = await prismaPSQL.dIM_DATABASE.findMany({ where: { deleted: false } });
    const typeIds = [...new Set(dbs.map(d => (d as any).id_type_db).filter(Boolean))];
    const typeMap: Record<string, string> = {};

    if (typeIds.length) {
        const refs: any[] = await prismaPSQL.rEF_TYPE_DB.findMany({ where: { id_type_db: { in: typeIds as any }, deleted: false } as any });
        refs.forEach(r => { typeMap[String(r.id_type_db)] = r.name_type_db || ''; });
    }

    return dbs
        .map((d) => {
            const idType: any = (d as any).id_type_db;
            const typeName = idType ? typeMap[String(idType)] || '' : '';
            if (!typeName || !typeRegex.test(typeName)) return null;
            
            const enc = (d as any).url_connection_db as string | null;
            if (!enc) return null;
            
            try {
                const dsn = decryptConnection(enc);
                const name = String((d as any).name_db || (d as any).id_db);
                return {
                    targets: [dsn],
                    labels: {
                        instance: name,
                        db_name: name,
                        db_type: typeLabel,
                    },
                };
            } catch (e: any) {
                logError(`monitoring.getDbTargets(${typeLabel}) - decrypt error`, { id_db: (d as any).id_db, error: e?.message || e });
                return null;
            }
        })
        .filter(Boolean);
};

export const getPostgresTargets = async () => {
    return getDbTargets(/^postgres/i, 'postgres');
};

export const getMssqlTargets = async () => {
    return getDbTargets(/^(mssql|sql server|sql_server)/i, 'mssql');
};

export const getMysqlTargets = async () => {
    return getDbTargets(/^mysql|maria/i, 'mysql');
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
