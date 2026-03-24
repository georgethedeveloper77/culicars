"use strict";
// apps/api/src/services/contributionService.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContribution = submitContribution;
exports.getContributionsByVin = getContributionsByVin;
exports.moderateContribution = moderateContribution;
exports.getContributionById = getContributionById;
const prisma_1 = __importDefault(require("../lib/prisma"));
const confidenceScorer_js_1 = require("./confidenceScorer.js");
const enrichmentService_js_1 = require("./enrichmentService.js");
// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------
async function submitContribution(submission, userId) {
    // Ensure vehicle exists
    const vehicle = await prisma_1.default.vehicle.findUnique({ where: { vin: submission.vin } });
    if (!vehicle) {
        throw Object.assign(new Error(`Vehicle not found: ${submission.vin}`), { status: 404 });
    }
    const factors = (0, confidenceScorer_js_1.buildFactors)({
        contribType: submission.type,
        evidenceUrls: submission.evidenceUrls ?? [],
        verificationDocUrls: submission.verificationDocUrls ?? [],
        isAuthenticatedUser: userId !== null,
        dataFields: submission.data ?? {},
    });
    const confidenceScore = (0, confidenceScorer_js_1.scoreContribution)(factors);
    const record = await prisma_1.default.contribution.create({
        data: {
            vin: submission.vin,
            userId: userId,
            type: submission.type,
            title: submission.title.trim(),
            description: submission.description?.trim() ?? null,
            data: (submission.data ?? {}),
            evidenceUrls: submission.evidenceUrls ?? [],
            verificationDocUrls: submission.verificationDocUrls ?? [],
            status: 'pending',
            confidenceScore: confidenceScore,
        },
    });
    return mapContribution(record);
}
// ---------------------------------------------------------------------------
// List by VIN
// ---------------------------------------------------------------------------
async function getContributionsByVin(vin, includeAll = false) {
    const where = { vin };
    if (!includeAll) {
        where['status'] = 'approved';
    }
    const rows = await prisma_1.default.contribution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapContribution);
}
// ---------------------------------------------------------------------------
// Moderate (admin)
// ---------------------------------------------------------------------------
async function moderateContribution(id, moderation, adminUserId) {
    const existing = await prisma_1.default.contribution.findUnique({ where: { id } });
    if (!existing) {
        throw Object.assign(new Error('Contribution not found'), { status: 404 });
    }
    const updated = await prisma_1.default.contribution.update({
        where: { id },
        data: {
            status: moderation.status,
            adminNote: moderation.adminNote ?? null,
            reviewedBy: adminUserId,
            reviewedAt: new Date(),
        },
    });
    // Apply to vehicle record if approved
    if (moderation.status === 'approved') {
        const contributionRow = {
            id: updated.id,
            vin: updated.vin,
            type: updated.type,
            title: updated.title,
            description: updated.description,
            data: updated.data,
            evidenceUrls: updated.evidenceUrls,
            confidenceScore: updated.confidenceScore ? Number(updated.confidenceScore) : null,
        };
        await (0, enrichmentService_js_1.applyContribution)(contributionRow);
    }
    return mapContribution(updated);
}
// ---------------------------------------------------------------------------
// Get single
// ---------------------------------------------------------------------------
async function getContributionById(id) {
    const row = await prisma_1.default.contribution.findUnique({ where: { id } });
    return row ? mapContribution(row) : null;
}
// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------
function mapContribution(row) {
    return {
        id: row['id'],
        vin: row['vin'],
        userId: row['user_id'] ?? null,
        type: row['type'],
        title: row['title'],
        description: row['description'] ?? null,
        data: row['data'] ?? null,
        evidenceUrls: row['evidence_urls'] ?? [],
        verificationDocUrls: row['verification_doc_urls'] ?? [],
        status: row['status'],
        adminNote: row['admin_note'] ?? null,
        reviewedBy: row['reviewed_by'] ?? null,
        reviewedAt: row['reviewed_at'] ? new Date(row['reviewed_at']) : null,
        confidenceScore: row['confidence_score'] ? Number(row['confidence_score']) : null,
        createdAt: new Date(row['created_at']),
    };
}
