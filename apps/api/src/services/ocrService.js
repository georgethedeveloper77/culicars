"use strict";
// ============================================================
// CuliCars — Thread 4: OCR Service (Main Orchestrator)
// ============================================================
// Orchestrates: upload → Vision API → extract plate/VIN/chassis
// → compute confidence → persist to ocr_scans.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageOcr = processImageOcr;
const prisma_1 = __importDefault(require("../lib/prisma"));
const visionClient_1 = require("./visionClient");
const plateExtractor_1 = require("./plateExtractor");
const vinExtractor_1 = require("./vinExtractor");
const chassisExtractor_1 = require("./chassisExtractor");
const ocrConfidence_1 = require("./ocrConfidence");
/**
 * Process an uploaded image through the OCR pipeline.
 *
 * Flow:
 * 1. Download/read image buffer
 * 2. Send to Google Cloud Vision (documentTextDetection)
 * 3. Extract plates, VINs, chassis numbers
 * 4. Score confidence
 * 5. Persist to ocr_scans table
 * 6. Return structured result
 */
async function processImageOcr(params) {
    const { imageBuffer, imageUrl, documentType, userId, source = 'user_upload' } = params;
    // Step 1: Run Vision API OCR
    const visionResult = await (0, visionClient_1.detectText)(imageBuffer);
    if (!visionResult.fullText.trim()) {
        // No text detected — save empty result
        return await saveOcrScan({
            userId,
            imageUrl,
            documentType,
            source,
            visionResult,
            extraction: emptyExtraction(),
            confidence: 0,
        });
    }
    // Step 2: Extract plate, VIN, chassis from OCR text
    const plates = (0, plateExtractor_1.extractPlates)(visionResult.fullText);
    const vins = (0, vinExtractor_1.extractVins)(visionResult.fullText);
    const chassis = (0, chassisExtractor_1.extractChassis)(visionResult.fullText);
    const extraction = {
        plates,
        vins,
        chassis,
        bestPlate: plates[0] ?? null,
        bestVin: vins[0] ?? null,
        bestChassis: chassis[0] ?? null,
        overallConfidence: 0, // calculated below
    };
    // Step 3: Calculate overall confidence
    const confidence = (0, ocrConfidence_1.calculateOverallConfidence)(visionResult, extraction);
    extraction.overallConfidence = confidence;
    // Step 4: Persist to ocr_scans
    return await saveOcrScan({
        userId,
        imageUrl,
        documentType,
        source,
        visionResult,
        extraction,
        confidence,
    });
}
/**
 * Save OCR scan result to database.
 */
async function saveOcrScan(params) {
    const { userId, imageUrl, documentType, source, visionResult, extraction, confidence, } = params;
    const scan = await prisma_1.default.ocrScan.create({
        data: {
            userId,
            imageUrl,
            documentType,
            source,
            rawOcrResult: visionResult,
            extractedPlate: extraction.bestPlate?.value ?? null,
            extractedVin: extraction.bestVin?.value ?? null,
            extractedChassis: extraction.bestChassis?.value ?? null,
            confidence,
        },
    });
    return {
        id: scan.id,
        documentType: scan.documentType,
        imageUrl: scan.imageUrl,
        extractedPlate: scan.extractedPlate,
        extractedVin: scan.extractedVin,
        extractedChassis: scan.extractedChassis,
        confidence: scan.confidence ?? 0,
        source: scan.source,
        rawOcrResult: visionResult,
        extraction,
    };
}
function emptyExtraction() {
    return {
        plates: [],
        vins: [],
        chassis: [],
        bestPlate: null,
        bestVin: null,
        bestChassis: null,
        overallConfidence: 0,
    };
}
