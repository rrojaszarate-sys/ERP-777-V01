/**
 * VERCEL SERVERLESS FUNCTION: OCR Processing con Google Vision
 * 
 * Endpoint: /api/ocr-process
 * Método: POST
 * Body: { image: "base64_string" }
 */

import vision from '@google-cloud/vision';

// Inicializar cliente de Google Vision
let visionClient = null;

function getVisionClient() {
  if (!visionClient) {
    try {
      // Obtener credenciales desde variable de entorno
      const credentials = JSON.parse(process.env.VITE_GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
      
      if (!credentials.client_email) {
        throw new Error('Google Cloud credentials not configured');
      }

      visionClient = new vision.ImageAnnotatorClient({
        credentials: credentials,
        projectId: credentials.project_id
      });

      console.log('✅ Google Vision client initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Vision:', error);
      throw error;
    }
  }
  return visionClient;
}

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Inicializar cliente
    const client = getVisionClient();

    // Procesar imagen con Google Vision
    const [result] = await client.textDetection({
      image: { content: image }
    });

    const detections = result.textAnnotations;
    const text = detections && detections.length > 0 ? detections[0].description : '';

    // Extraer información estructurada
    const structuredData = extractReceiptInfo(text);

    return res.status(200).json({
      success: true,
      text: text,
      data: structuredData,
      confidence: result.textAnnotations?.[0]?.confidence || 0
    });

  } catch (error) {
    console.error('Error processing OCR:', error);
    return res.status(500).json({
      error: 'OCR processing failed',
      message: error.message
    });
  }
}

/**
 * Extrae información estructurada del texto OCR
 */
function extractReceiptInfo(text) {
  if (!text) return {};

  const lines = text.split('\n');
  const data = {
    proveedor: '',
    rfc: '',
    fecha: '',
    subtotal: 0,
    iva: 0,
    total: 0,
    items: []
  };

  // Patrones de extracción
  const rfcPattern = /[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}/;
  const fechaPattern = /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
  const montoPattern = /\$?\s*(\d{1,3}(?:,?\d{3})*(?:\.\d{2})?)/g;

  // Buscar RFC
  const rfcMatch = text.match(rfcPattern);
  if (rfcMatch) data.rfc = rfcMatch[0];

  // Buscar fecha
  const fechaMatch = text.match(fechaPattern);
  if (fechaMatch) data.fecha = fechaMatch[0];

  // Buscar montos (último suele ser el total)
  const montos = [...text.matchAll(montoPattern)].map(m => 
    parseFloat(m[1].replace(/,/g, ''))
  );

  if (montos.length > 0) {
    data.total = montos[montos.length - 1];
    if (montos.length >= 3) {
      data.subtotal = montos[montos.length - 3];
      data.iva = montos[montos.length - 2];
    }
  }

  // Proveedor (primera línea no vacía)
  data.proveedor = lines.find(line => line.trim().length > 3) || '';

  return data;
}
