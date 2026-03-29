"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDataSources = listDataSources;
exports.getDataSource = getDataSource;
exports.createDataSource = createDataSource;
exports.updateDataSource = updateDataSource;
exports.triggerManualRun = triggerManualRun;
exports.deleteDataSource = deleteDataSource;
// apps/api/src/services/dataSourcesService.ts
const database_1 = require("@culicars/database");
const crypto_1 = __importDefault(require("crypto"));
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY ?? '';
const ALGORITHM = 'aes-256-gcm';
function encrypt(plaintext) {
    if (!ENCRYPTION_KEY)
        throw new Error('CREDENTIALS_ENCRYPTION_KEY not set');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = crypto_1.default.randomBytes(12);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}
function decrypt(stored) {
    if (!ENCRYPTION_KEY)
        throw new Error('CREDENTIALS_ENCRYPTION_KEY not set');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const [ivB64, tagB64, dataB64] = stored.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final('utf8');
}
function safeProject(source) {
    const { credentials_enc, ...rest } = source;
    return { ...rest, has_credentials: !!credentials_enc };
}
async function listDataSources() {
    const sources = await database_1.prisma.data_sources.findMany({ orderBy: { created_at: 'desc' } });
    return sources.map(safeProject);
}
async function getDataSource(id) {
    const source = await database_1.prisma.data_sources.findUnique({ where: { id } });
    if (!source)
        return null;
    return safeProject(source);
}
async function createDataSource(input) {
    const credentials_enc = input.credentials ? encrypt(JSON.stringify(input.credentials)) : null;
    const source = await database_1.prisma.data_sources.create({
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
async function updateDataSource(id, input) {
    const updateData = {};
    if (input.name !== undefined)
        updateData.name = input.name;
    if (input.type !== undefined)
        updateData.type = input.type;
    if (input.parser_type !== undefined)
        updateData.parser_type = input.parser_type;
    if (input.schedule !== undefined)
        updateData.schedule = input.schedule;
    if (input.enabled !== undefined)
        updateData.enabled = input.enabled;
    if (input.credentials !== undefined) {
        updateData.credentials_enc = input.credentials ? encrypt(JSON.stringify(input.credentials)) : null;
    }
    const source = await database_1.prisma.data_sources.update({ where: { id }, data: updateData });
    return safeProject(source);
}
async function triggerManualRun(id) {
    const source = await database_1.prisma.data_sources.findUnique({ where: { id } });
    if (!source)
        throw new Error('Data source not found');
    if (!source.enabled)
        throw new Error('Data source is disabled');
    let credentials = null;
    if (source.credentials_enc) {
        try {
            credentials = JSON.parse(decrypt(source.credentials_enc));
        }
        catch {
            throw new Error('Failed to decrypt credentials');
        }
    }
    let records_ingested = 0;
    let runError;
    const ran_at = new Date();
    try {
        const adapter = await resolveAdapter(source.parser_type, credentials);
        records_ingested = await adapter.run();
    }
    catch (err) {
        runError = err?.message ?? 'Unknown error';
    }
    await database_1.prisma.data_sources.update({
        where: { id },
        data: {
            last_run_at: ran_at,
            last_status: runError ? `error: ${runError}` : `ok: ${records_ingested} records`,
        },
    });
    return { success: !runError, records_ingested, error: runError, ran_at };
}
async function resolveAdapter(parserType, credentials) {
    try {
        const mod = await Promise.resolve(`${`./scrapers/${parserType}.js`}`).then(s => __importStar(require(s)));
        const factory = mod.default ?? mod;
        if (typeof factory === 'function')
            return factory(credentials);
        return factory;
    }
    catch (err) {
        if (err.code === 'MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
            throw new Error(`No adapter found for parser_type '${parserType}'`);
        }
        throw err;
    }
}
async function deleteDataSource(id) {
    await database_1.prisma.data_sources.delete({ where: { id } });
}
