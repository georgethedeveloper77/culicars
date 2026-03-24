"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJob = createJob;
exports.updateJob = updateJob;
exports.completeJob = completeJob;
exports.failJob = failJob;
exports.getJob = getJob;
exports.listJobs = listJobs;
// apps/api/src/services/scraperJobService.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
async function createJob(source, trigger = 'scheduled') {
    return prisma_1.default.scraperJob.create({
        data: { source, trigger, status: 'queued' },
    });
}
async function updateJob(id, data) {
    return prisma_1.default.scraperJob.update({ where: { id }, data });
}
async function completeJob(id, counts) {
    return prisma_1.default.scraperJob.update({
        where: { id },
        data: {
            status: 'completed',
            completedAt: new Date(),
            ...counts,
        },
    });
}
async function failJob(id, errorMessage) {
    return prisma_1.default.scraperJob.update({
        where: { id },
        data: {
            status: 'failed',
            completedAt: new Date(),
            errorLog: errorMessage,
        },
    });
}
async function getJob(id) {
    return prisma_1.default.scraperJob.findUnique({ where: { id } });
}
async function listJobs(limit = 50) {
    return prisma_1.default.scraperJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}
