// ============================================================
// CuliCars — Thread 4: Google Cloud Vision Client
// ============================================================

import { ImageAnnotatorClient } from '@google-cloud/vision';
import type { VisionResponse, VisionAnnotation } from '../types/ocr.types';

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    // Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically
    client = new ImageAnnotatorClient();
  }
  return client;
}

/**
 * Run OCR (TEXT_DETECTION) on an image buffer.
 * Returns structured text with per-block confidence.
 */
export async function detectText(imageBuffer: Buffer): Promise<VisionResponse> {
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

  const blocks: VisionAnnotation[] = [];
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
export async function detectTextFromPdf(
  pdfBuffer: Buffer
): Promise<VisionResponse> {
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

  const blocks: VisionAnnotation[] = [];
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
function extractBlockText(block: any): string {
  const parts: string[] = [];
  for (const paragraph of block.paragraphs || []) {
    const words: string[] = [];
    for (const word of paragraph.words || []) {
      const symbols = (word.symbols || [])
        .map((s: any) => s.text || '')
        .join('');
      words.push(symbols);
    }
    parts.push(words.join(' '));
  }
  return parts.join('\n');
}
