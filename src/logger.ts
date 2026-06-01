export const log = {
  info: (msg: string) => console.log(`[diagram-sync] ${msg}`),
  success: (msg: string) => console.log(`[diagram-sync] OK ${msg}`),
  warn: (msg: string) => console.warn(`[diagram-sync] WARN ${msg}`),
  error: (msg: string) => console.error(`[diagram-sync] ERR ${msg}`),
};
