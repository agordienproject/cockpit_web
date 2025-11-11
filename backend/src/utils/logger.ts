// Simple logger utility used across controllers
export const info = (msg: string, meta?: any) => {
  try {
    const time = new Date().toISOString();
    const payload = meta ? JSON.stringify(meta) : '';
    // keep it one-line for easier grepping in logs
    console.log(`[INFO] ${time} - ${msg} ${payload}`);
  } catch (e) {
    // swallow logging errors
  }
};

export const error = (msg: string, meta?: any) => {
  try {
    const time = new Date().toISOString();
    const payload = meta ? JSON.stringify(meta) : '';
    console.error(`[ERROR] ${time} - ${msg} ${payload}`);
  } catch (e) {
    // swallow logging errors
  }
};

export default { info, error };
