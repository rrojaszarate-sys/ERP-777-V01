#!/usr/bin/env python3
"""
Script para reemplazar la sección OCR en DualOCRExpenseForm.tsx
"""

import re

file_path = "/home/rodrichrz/proyectos/V20--- recuperacion/project2/src/modules/eventos/components/finances/DualOCRExpenseForm.tsx"

# Leer el archivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Definir el patrón de inicio y fin
start_pattern = r'\{/\* Selector de Motor OCR \*/\}'
end_pattern = r'\{/\* Resultado OCR \*/\}'

# Nuevo código a insertar
new_code = '''      {/* Área de Drag & Drop para OCR */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Subir Ticket/Factura para Procesamiento OCR
          </div>
        </label>
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileUpload(selectedFile);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessingOCR}
          />
          
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-200'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <>
                <p className="text-base font-medium text-gray-700">
                  {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu ticket/factura aquí'}
                </p>
                <p className="text-sm text-gray-500">
                  o haz clic para seleccionar
                </p>
              </>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-400">Imágenes JPG/PNG/WebP</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">PDFs</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">Máx. 10MB</span>
            </div>
          </div>
        </div>
        
        {/* Barra de Progreso */}
        {isProcessingOCR && ocrProgress && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-900">{ocrProgress}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 animate-pulse"
                style={{ width: ocrProgress.includes('Completado') ? '100%' : '60%' }}
              ></div>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-3">
          <span className="font-medium">🤖 OCR Inteligente:</span> Usa Google Vision/OCR.space (alta calidad) con fallback automático a Tesseract
        </p>
      </div>

      '''

# Usar regex para encontrar y reemplazar
pattern = re.compile(
    r'(\{/\* Selector de Motor OCR \*/\}.*?)(\{/\* Resultado OCR \*/\})',
    re.DOTALL
)

# Reemplazar
new_content = pattern.sub(rf'{new_code}\2', content)

# Guardar el archivo
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Reemplazo completado exitosamente!")
print(f"Archivo actualizado: {file_path}")
