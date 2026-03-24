"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPlate = checkPlate;
exports.checkVin = checkVin;
exports.checkVehicle = checkVehicle;
// apps/api/src/services/stolenAlertService.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
async function checkPlate(plate) {
    const normalised = normalisePlate(plate);
    const reports = await prisma_1.default.stolenReport.findMany({
        where: { plate: normalised, status: 'active' },
        orderBy: { createdAt: 'desc' },
    });
    return { hasActiveReport: reports.length > 0, reports: reports.map(mapReport) };
}
async function checkVin(vin) {
    const reports = await prisma_1.default.stolenReport.findMany({
        where: { vin, status: 'active' },
        orderBy: { createdAt: 'desc' },
    });
    return { hasActiveReport: reports.length > 0, reports: reports.map(mapReport) };
}
async function checkVehicle(params) {
    if (!params.plate && !params.vin) {
        return { hasActiveReport: false, reports: [] };
    }
    const conditions = [];
    if (params.plate)
        conditions.push({ plate: normalisePlate(params.plate), status: 'active' });
    if (params.vin)
        conditions.push({ vin: params.vin, status: 'active' });
    const reports = await prisma_1.default.stolenReport.findMany({
        where: { OR: conditions },
        orderBy: { createdAt: 'desc' },
    });
    const seen = new Set();
    const unique = reports.filter((r) => {
        if (seen.has(r.id))
            return false;
        seen.add(r.id);
        return true;
    });
    return { hasActiveReport: unique.length > 0, reports: unique.map(mapReport) };
}
function normalisePlate(plate) {
    return plate.toUpperCase().replace(/\s+/g, '');
}
function mapReport(row) {
    return {
        id: row['id'],
        plate: row['plate'],
        plateDisplay: row['plateDisplay'] ?? null,
        vin: row['vin'] ?? null,
        reporterUserId: row['reporterUserId'] ?? null,
        reporterType: row['reporterType'],
        dateStolenIso: row['dateStolen'],
        countyStolen: row['countyStolen'],
        townStolen: row['townStolen'],
        policeObNumber: row['policeObNumber'] ?? null,
        policeStation: row['policeStation'] ?? null,
        carColor: row['carColor'],
        identifyingMarks: row['identifyingMarks'] ?? null,
        photoUrls: row['photoUrls'] ?? [],
        contactPhone: row['contactPhone'] ?? null,
        contactEmail: row['contactEmail'] ?? null,
        status: row['status'],
        isObVerified: Boolean(row['isObVerified']),
        adminNote: row['adminNote'] ?? null,
        reviewedBy: row['reviewedBy'] ?? null,
        reviewedAt: row['reviewedAt'] ? new Date(row['reviewedAt']) : null,
        recoveryDate: row['recoveryDate'] ?? null,
        recoveryCounty: row['recoveryCounty'] ?? null,
        recoveryNotes: row['recoveryNotes'] ?? null,
        createdAt: new Date(row['createdAt']),
    };
}
