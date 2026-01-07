import { Router, Request, Response } from 'express';
import { prismaPSQL } from '../prisma/client_psql';
import { info, error as logError } from '../utils/logger';
import { decryptConnection } from '../utils/crypto';

const router = Router();

const POSTGRES_SD_TOKEN = process.env.PROMETHEUS_SD_TOKEN || '';

// Prometheus HTTP SD endpoint
router.get('/prometheus/targets', async (_req: Request, res: Response) => {
  info('monitoring.httpSD - request received');
  try {
    const machines: any[] = await prismaPSQL.dIM_MACHINE.findMany({ where: { deleted: false } });
    const osIds = [...new Set(machines.map(m => (m as any).id_os_machine).filter(Boolean))];
    const osMap: Record<string, string> = {};
    if (osIds.length) {
      const osRefs: any[] = await prismaPSQL.rEF_OS_MACHINE.findMany({ where: { id_os_machine: { in: osIds as any }, deleted: false } as any });
      osRefs.forEach(r => { osMap[String(r.id_os_machine)] = r.name_os_machine || ''; });
    }
    const groups = machines
      .filter((m) => !!m.url_metrics_machine)
      .map((m) => {
        const idOs = (m as any).id_os_machine;
        const osName = idOs ? osMap[String(idOs)] || '' : '';
        return {
          targets: [String(m.url_metrics_machine)],
          labels: {
            instance: String(m.url_metrics_machine),
            machine: String(m.name_machine || m.id_machine),
            hostname: String(m.name_machine || m.id_machine),
            os: (osName ? osName.toLowerCase() : ''),
          },
        };
      });
    info('monitoring.httpSD - served groups', { count: groups.length });
    res.status(200).json(groups);
  } catch (e: any) {
    logError('monitoring.httpSD - error', { error: e?.message || e });
    res.status(500).json([]);
  }
});

// PostgreSQL HTTP SD endpoint for postgres_exporter (DSN targets)
router.get('/prometheus/postgres-targets', async (req: Request, res: Response) => {
  const token = (req.query.token as string | undefined) || '';
  if (!POSTGRES_SD_TOKEN || token !== POSTGRES_SD_TOKEN) {
    info('monitoring.postgresTargets - invalid or missing token');
    return res.status(403).json([]);
  }

  info('monitoring.postgresTargets - request received');
  try {
    const dbs: any[] = await prismaPSQL.dIM_DATABASE.findMany({ where: { deleted: false } });
    const typeIds = [...new Set(dbs.map(d => (d as any).id_type_db).filter(Boolean))];
    const typeMap: Record<string, string> = {};
    if (typeIds.length) {
      const refs: any[] = await prismaPSQL.rEF_TYPE_DB.findMany({ where: { id_type_db: { in: typeIds as any }, deleted: false } as any });
      refs.forEach(r => { typeMap[String(r.id_type_db)] = r.name_type_db || ''; });
    }

    const groups = dbs
      .map((d) => {
        const idType: any = (d as any).id_type_db;
        const typeName = idType ? typeMap[String(idType)] || '' : '';
        if (!typeName || !/^postgres/i.test(typeName)) return null;
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
              db_type: 'postgres',
            },
          };
        } catch (e: any) {
          logError('monitoring.postgresTargets - decrypt error', { id_db: (d as any).id_db, error: e?.message || e });
          return null;
        }
      })
      .filter(Boolean);

    info('monitoring.postgresTargets - served groups', { count: groups.length });
    res.status(200).json(groups);
  } catch (e: any) {
    logError('monitoring.postgresTargets - error', { error: e?.message || e });
    res.status(500).json([]);
  }
});

export default router;
