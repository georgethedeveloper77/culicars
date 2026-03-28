// apps/api/src/services/visionClient.ts

import { ImageAnnotatorClient } from '@google-cloud/vision';

let _client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!_client) {
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const keyJson = process.env.GOOGLE_CLOUD_VISION_KEY_JSON;

    if (keyJson) {
      const credentials = JSON.parse(keyJson);
      _client = new ImageAnnotatorClient({ credentials });
    } else if (keyFile) {
      _client = new ImageAnnotatorClient({ keyFilename: keyFile });
    } else {
      throw new Error(
        'Google Cloud Vision credentials not configured. ' +
        'Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_VISION_KEY_JSON.',
      );
    }
  }
  return _client;
}

/**
 * Runs text detection on a base64-encoded image.
 * Returns the full text annotation string.
 */
async function detectText(imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  const client = getClient();
  const [result] = await client.textDetection({
    image: { content: imageBase64 },
  });

  const annotations = result.textAnnotations;
  if (!annotations || annotations.length === 0) return '';
  // The first annotation contains the full text block
  return annotations[0].description ?? '';
}

/**
 * Extracts text from a base64-encoded PDF using Vision's document text detection.
 * Concatenates all pages.
 */
async function detectTextInPdf(pdfBase64: string): Promise<string> {
  const client = getClient();
  const [result] = await client.documentTextDetection({
    image: {
      content: pdfBase64,
    },
  });

  const fullText = result.fullTextAnnotation;
  if (!fullText) return '';
  return fullText.text ?? '';
}

export const visionClient = { detectText, detectTextInPdf };
