import * as workerService from "../services/worker.service";

export const verifyWorkerCreds = async (req: any, res: any, next: any) => {
  try {
    // Expect creds in header 'x-worker-creds' or body.creds_worker
    const creds = req.headers["x-worker-creds"] || req.body?.creds_worker || req.query?.creds_worker;
    const id_machine = req.body?.id_machine || req.query?.id_machine || (req.params && req.params.id_machine);
    const id_sys = req.body?.id_sys || req.query?.id_sys || (req.params && req.params.id_sys);

    if (!creds) return res.status(401).json({ message: "Missing worker credentials" });

    const worker = await workerService.findWorkerByCredsForMachineAndSystem(creds as string, id_machine, id_sys);
    if (!worker) return res.status(403).json({ message: "Invalid worker credentials for this machine/system" });

    // attach worker to request for downstream handlers
    req.worker = worker;
    next();
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export default {};
