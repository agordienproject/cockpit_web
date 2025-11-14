import { Router, Request, Response } from 'express';
import { prismaPSQL } from '../prisma/client_psql';
import { info, error as logError } from '../utils/logger';

const router = Router();

// Prometheus HTTP SD endpoint
router.get('/prometheus/targets', async (_req: Request, res: Response) => {
  try {
    const machines = await prismaPSQL.dIM_MACHINE.findMany({ where: { deleted: false } });
    const groups = machines
      .filter((m: any) => !!m.url_metrics_machine)
      .map((m: any) => ({
        targets: [String(m.url_metrics_machine)],
        labels: {
          instance: String(m.url_metrics_machine),
          machine: String(m.name_machine || m.id_machine),
          os: String(m.os_machine || '').toLowerCase(),
        },
      }));
    info('monitoring.httpSD - served groups', { count: groups.length });
    res.status(200).json(groups);
  } catch (e: any) {
    logError('monitoring.httpSD - error', { error: e?.message || e });
    res.status(500).json([]);
  }
});

export default router;
