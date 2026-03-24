"use strict";
// ============================================================
// CuliCars — Thread 4: Google Cloud Vision Client
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectText = detectText;
exports.detectTextFromPdf = detectTextFromPdf;
const vision_1 = require("@google-cloud/vision");
let client = null;
function getClient() {
    if (!client) {
        // Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically
        client = new vision_1.ImageAnnotatorClient();
    }
    return client;
}
/**
 * Run OCR (TEXT_DETECTION) on an image buffer.
 * Returns structured text with per-block confidence.
 */
async function detectText(imageBuffer) {
    const visionClient = getClient();
    const [result] = await visionClient.documentTextDetection({
        image: { content: imageBuffer.toString('base64') },
        imageContext: {
            languageHints: ['en'],
        },
    });
    const fullTextAnnotation = result.fullTextAnnotation;
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
        return { fullText: '', blocks: [], confidence: 0 };
    }
    const blocks = [];
    let totalConfidence = 0;
    let blockCount = 0;
    for (const page of fullTextAnnotation.pages || []) {
        for (const block of page.blocks || []) {
            const blockText = extractBlockText(block);
            const blockConfidence = block.confidence ?? 0;
            if (blockText.trim()) {
                blocks.push({
                    text: blockText.trim(),
                    confidence: blockConfidence,
                    boundingBox: block.boundingBox?.vertices
                        ? {
                            vertices: block.boundingBox.vertices.map((v) => ({
                                x: v.x ?? 0,
                                y: v.y ?? 0,
                            })),
                        }
                        : undefined,
                });
                totalConfidence += blockConfidence;
                blockCount++;
            }
        }
    }
    return {
        fullText: fullTextAnnotation.text,
        blocks,
        confidence: blockCount > 0 ? totalConfidence / blockCount : 0,
    };
}
/**
 * Run OCR on a PDF buffer (for NTSA COR).
 * Uses DOCUMENT_TEXT_DETECTION with PDF input.
 */
async function detectTextFromPdf(pdfBuffer) {
    const visionClient = getClient();
    const [result] = await visionClient.documentTextDetection({
        image: { content: pdfBuffer.toString('base64') },
        imageContext: {
            languageHints: ['en'],
        },
    });
    const fullTextAnnotation = result.fullTextAnnotation;
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
        return { fullText: '', blocks: [], confidence: 0 };
    }
    const blocks = [];
    let totalConfidence = 0;
    let blockCount = 0;
    for (const page of fullTextAnnotation.pages || []) {
        for (const block of page.blocks || []) {
            const blockText = extractBlockText(block);
            const blockConfidence = block.confidence ?? 0;
            if (blockText.trim()) {
                blocks.push({
                    text: blockText.trim(),
                    confidence: blockConfidence,
                });
                totalConfidence += blockConfidence;
                blockCount++;
            }
        }
    }
    return {
        fullText: fullTextAnnotation.text,
        blocks,
        confidence: blockCount > 0 ? totalConfidence / blockCount : 0,
    };
}
/**
 * Extract text from a Vision block by traversing paragraphs → words → symbols.
 */
function extractBlockText(block) {
    const parts = [];
    for (const paragraph of block.paragraphs || []) {
        const words = [];
        for (const word of paragraph.words || []) {
            const symbols = (word.symbols || [])
                .map((s) => s.text || '')
                .join('');
            words.push(symbols);
        }
        parts.push(words.join(' '));
    }
    return parts.join('\n');
}
