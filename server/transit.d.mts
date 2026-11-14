import type { IncomingMessage, ServerResponse } from 'node:http';
export function handleRequest(req: IncomingMessage, res: ServerResponse, env?: Record<string, string | undefined>, fetcher?: typeof fetch): Promise<boolean>;
