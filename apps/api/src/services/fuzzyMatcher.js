"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSimilarPlates = findSimilarPlates;
exports.getSuggestionStrings = getSuggestionStrings;
// apps/api/src/services/fuzzyMatcher.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++)
        dp[i][0] = i;
    for (let j = 0; j <= n; j++)
        dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}
async function findSimilarPlates(normalizedPlate, maxDistance = 2, limit = 5) {
    let prefix;
    if (normalizedPlate.startsWith('K')) {
        prefix = normalizedPlate.substring(0, 3);
    }
    else {
        prefix = normalizedPlate.substring(0, 2);
    }
    const candidates = await prisma_1.default.plateVinMap.findMany({
        where: { plate: { startsWith: prefix } },
        select: { plate: true, plateDisplay: true, vin: true },
        take: 200,
    });
    return candidates
        .map((c) => ({
        plate: c.plate,
        plateDisplay: c.plateDisplay,
        vin: c.vin,
        distance: levenshtein(normalizedPlate, c.plate),
    }))
        .filter((s) => s.distance > 0 && s.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
}
async function getSuggestionStrings(normalizedPlate, maxDistance = 2) {
    const suggestions = await findSimilarPlates(normalizedPlate, maxDistance);
    return suggestions.map((s) => s.plateDisplay ?? s.plate);
}
