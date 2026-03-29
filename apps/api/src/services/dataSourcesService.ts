// apps/api/src/services/dataSourcesService.ts
import { prisma } from '@culicars/database';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY ?? '';
const ALGORITHM = 'aes-256-gcm';

function encrypt(plaintext: string): string {
  if (!ENCRYPTION_KEY) throw new Error('CREDENTIALS_ENCRYPTION_KEY not set');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(stored: string): string {
  if (!ENCRYPTION_KEY) throw new Error('CREDENTIALS_ENCRYPTION_KEY not set');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const [ivB64, tagB64, dataB64] = stored.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

function safeProject(source: any) {
  const { credentials_enc, ...rest } = source;
  return { ...rest, has_credentials: !!credentials_enc };
}

export async function listDataSources() {
  const sources = await prisma.dataSource.findMany({ orderBy: { created_at: 'desc' } });
  return sources.map(safeProject);
}

export async function getDataSource(id: string) {
  const source = await prisma.dataSource.findUnique({ where: { id } });
  if (!source) return null;
  return safeProject(source);
}

export interface CreateDataSourceInput {
  name: string;
  type: string;
  parser_type: string;
  schedule?: string | null;
  credentials?: Record<string, string> | null;
  enabled?: boolean;
}

export async function createDataSource(input: CreateDataSourceInput) {
  const credentials_enc = input.credentials ? encrypt(JSON.stringify(input.credentials)) : null;
  const source = await prisma.dataSource.create({
    data: {
      name: input.name,
      type: input.type,
      parser_type: input.parser_type,
      schedule: input.schedule ?? null,
      credentials_enc,
      enabled: input.enabled ?? true,
    },
  });
  return safeProject(source);
}

export interface UpdateDataSourceInput {
  name?: string;
  type?: string;
  parser_type?: string;
  schedule?: string | null;
  credentials?: Record<string, string> | null;
  enabled?: boolean;
}

export async function updateDataSource(id: string, input: UpdateDataSourceInput) {
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.parser_type !== undefined) updateData.parser_type = input.parser_type;
  if (input.schedule !== undefined) updateData.schedule = input.schedule;
  if (input.enabled !== undefined) updateData.enabled = input.enabled;
  if (input.credentials !== undefined) {
    updateData.credentials_enc = input.credentials ? encrypt(JSON.stringify(input.credentials)) : null;
  }
  const source = await prisma.dataSource.update({ where: { id }, data: updateData });
  return safeProject(source);
}

export interface RunResult {
  success: boolean;
  records_ingested: number;
  error?: string;
  ran_at: Date;
}

export async function triggerManualRun(id: string): Promise<RunResult> {
  const source = await prisma.dataSource.findUnique({ where: { id } });
  if (!source) throw new Error('Data source not found');
  if (!source.enabled) throw new Error('Data source is disabled');

  let credentials: Record<string, string> | null = null;
  if (source.credentials_enc) {
    try {
      credentials = JSON.parse(decrypt(source.credentials_enc));
    } catch {
      throw new Error('Failed to decrypt credentials');
    }
  }

  let records_ingested = 0;
  let runError: string | undefined;
  const ran_at = new Date();

  try {
    const adapter = await resolveAdapter(source.parser_type, credentials);
    records_ingested = await adapter.run();
  } catch (err: any) {
    runError = err?.message ?? 'Unknown error';
  }

  await prisma.dataSource.update({
    where: { id },
    data: {
      last_run_at: ran_at,
      last_status: runError ? `error: ${runError}` : `ok: ${records_ingested} records`,
    },
  });

  return { success: !runError, records_ingested, error: runError, ran_at };
}

interface Adapter {
  run(): Promise<number>;
}

async function resolveAdapter(parserType: string, credentials: Record<string, string> | null): Promise<Adapter> {
  try {
    const mod = await import(`./scrapers/${parserType}.js`);
    const factory = mod.default ?? mod;
    if (typeof factory === 'function') return factory(credentials);
    return factory;
  } catch (err: any) {
    if (err.code === 'MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
      throw new Error(`No adapter found for parser_type '${parserType}'`);
    }
    throw err;
  }
}

export async function deleteDataSource(id: string) {
  await prisma.dataSource.delete({ where: { id } });
}
