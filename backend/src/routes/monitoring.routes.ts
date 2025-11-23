import { Router, Request, Response } from 'express';
import { prismaPSQL } from '../prisma/client_psql';
import { info, error as logError } from '../utils/logger';

const router = Router();

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

export default router;
