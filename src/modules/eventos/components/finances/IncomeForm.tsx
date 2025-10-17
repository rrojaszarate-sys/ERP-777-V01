import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Calculator, Loader2, AlertTriangle, Calendar, Bot, Zap, Upload, UserCheck } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { FileUpload } from '../../../../shared/components/ui/FileUpload';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useUsers } from '../../hooks/useUsers';
import { useClients } from '../../hooks/useClients';
import { formatCurrency } from '../../../../shared/utils/formatters';
import { MEXICAN_CONFIG } from '../../../../core/config/constants';
import { Income } from '../../types/Finance';
import { useOCRIntegration } from '../../../ocr/hooks/useOCRIntegration';
import { parseCFDIXml, cfdiToIncomeData } from '../../utils/cfdiXmlParser';
import { toast } from 'react-hot-toast';

interface IncomeFormProps {
  income?: Income | null;
  eventId: string;
  onSave: (data: Partial<Income>) => void;
  onCancel: () => void;
  className?: string;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  income,
  eventId,
  onSave,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    concepto: income?.concepto || '',
    descripcion: income?.descripcion || '',
    total: income?.total || 0, // ✅ Solo el total importa (del XML)
    iva_porcentaje: income?.iva_porcentaje || MEXICAN_CONFIG.ivaRate,
    fecha_ingreso: income?.fecha_ingreso || new Date().toISOString().split('T')[0],
    referencia: income?.referencia || '',
    metodo_cobro: income?.metodo_cobro || 'transferencia',
    facturado: income?.facturado !== undefined ? income.facturado : true, // ✅ SIEMPRE empieza facturado
    cobrado: income?.cobrado || false,
    dias_credito: income?.dias_credito || 30, // ✅ NUEVO: Días de crédito para calcular vencimiento
    fecha_compromiso_pago: income?.fecha_compromiso_pago || '',
    fecha_facturacion: income?.fecha_facturacion || new Date().toISOString().split('T')[0], // ✅ Auto-llenar con fecha actual
    fecha_cobro: income?.fecha_cobro || '',
    responsable_id: income?.responsable_id || '', // ✅ Responsable del seguimiento
    cliente_id: income?.cliente_id || '', // ✅ OBLIGATORIO: Cliente receptor de la factura
    cliente: income?.cliente || '', // ✅ Nombre del cliente
    rfc_cliente: income?.rfc_cliente || '', // ✅ RFC del cliente
    archivo_adjunto: income?.archivo_adjunto || '',
    archivo_nombre: income?.archivo_nombre || '',
    archivo_tamaño: income?.archivo_tamaño || 0,
    archivo_tipo: income?.archivo_tipo || '',
    documento_pago_url: income?.documento_pago_url || '', // ✅ NUEVO: Comprobante de pago
    documento_pago_nombre: income?.documento_pago_nombre || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();
  const { processOCRFile, isProcessing, error: ocrError } = useOCRIntegration(eventId);
  const { data: users, loading: loadingUsers } = useUsers(); // ✅ Cargar usuarios activos
  const { clients, loading: loadingClients } = useClients(); // ✅ Cargar clientes

  // 🆕 ESTADOS SEPARADOS PARA XML Y PDF (INGRESOS)
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // ✅ Calculate totals FROM total (not from cantidad × precio_unitario)
  const total = formData.total;
  const iva_factor = 1 + (formData.iva_porcentaje / 100);
  const subtotal = total / iva_factor;
  const iva = total - subtotal;

  // ✅ AUTO-CALCULAR fecha de compromiso de pago basado en días de crédito
  React.useEffect(() => {
    if (formData.fecha_facturacion && formData.dias_credito) {
      const fechaFacturacion = new Date(formData.fecha_facturacion);
      fechaFacturacion.setDate(fechaFacturacion.getDate() + formData.dias_credito);
      const fechaCompromiso = fechaFacturacion.toISOString().split('T')[0];
      
      // Solo actualizar si es diferente para evitar loop infinito
      if (formData.fecha_compromiso_pago !== fechaCompromiso) {
        setFormData(prev => ({
          ...prev,
          fecha_compromiso_pago: fechaCompromiso
        }));
      }
    }
  }, [formData.fecha_facturacion, formData.dias_credito]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.concepto.trim()) {
      newErrors.concepto = 'El concepto es requerido';
    }

    if (formData.total <= 0) {
      newErrors.total = 'El total debe ser mayor a 0';
    }

    if (!formData.fecha_ingreso) {
      newErrors.fecha_ingreso = 'La fecha de ingreso es requerida';
    }

    // ✅ VALIDAR CLIENTE OBLIGATORIO
    if (!formData.cliente_id || !formData.cliente_id.trim()) {
      newErrors.cliente_id = 'El cliente es obligatorio';
    }

    // Validate that PDF is uploaded for income
    if (!formData.archivo_adjunto) {
      if (pdfFile && !formData.archivo_adjunto) {
        newErrors.archivo_adjunto = '⚠️ Debes clickear "Procesar XML + PDF" primero para subir los archivos';
      } else {
        newErrors.archivo_adjunto = 'La factura PDF es obligatoria para los ingresos';
      }
    }

    // Validate payment commitment date if invoiced
    if (formData.facturado && !formData.fecha_compromiso_pago) {
      newErrors.fecha_compromiso_pago = 'La fecha de compromiso de pago es requerida para ingresos facturados';
    }

    // Validate that commitment date is after invoice date
    if (formData.fecha_facturacion && formData.fecha_compromiso_pago &&
        new Date(formData.fecha_compromiso_pago) < new Date(formData.fecha_facturacion)) {
      newErrors.fecha_compromiso_pago = 'La fecha de compromiso debe ser posterior a la fecha de facturación';
    }

    // Validate payment date if marked as paid
    if (formData.cobrado && !formData.fecha_cobro) {
      newErrors.fecha_cobro = 'La fecha de cobro es requerida para ingresos pagados';
    }

    // ✅ VALIDAR: Comprobante de pago requerido cuando está cobrado
    if (formData.cobrado && !formData.documento_pago_url) {
      newErrors.documento_pago_url = 'El comprobante de pago es obligatorio para ingresos cobrados';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Mostrar errores al usuario
      const errorMessages = Object.entries(errors).map(([field, message]) => message);
      toast.error(`❌ Por favor corrige los siguientes errores:\n${errorMessages.join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSave = {
        ...formData,
        subtotal,
        iva,
        total,
        evento_id: eventId,
        created_at: income ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave(dataToSave);
    } catch (error) {
      console.error('Error saving income:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUploaded = (result: any) => {
    setFormData(prev => ({
      ...prev,
      archivo_adjunto: result.url,
      archivo_nombre: result.fileName,
      archivo_tamaño: result.fileSize,
      archivo_tipo: result.mimeType
    }));
    
    // Clear file error if it exists
    if (errors.archivo_adjunto) {
      setErrors(prev => ({ ...prev, archivo_adjunto: '' }));
    }

    // Auto-extract data from filename if possible
    if (result.fileName.toLowerCase().includes('factura')) {
      const match = result.fileName.match(/(\d+)/);
      if (match) {
        setFormData(prev => ({
          ...prev,
          referencia: `FACT-${match[1]}`
        }));
      }
    }
  };

  const handleFileRemoved = () => {
    setFormData(prev => ({
      ...prev,
      archivo_adjunto: '',
      archivo_nombre: '',
      archivo_tamaño: 0,
      archivo_tipo: ''
    }));
  };

  // 🆕 FUNCIÓN PARA PROCESAR XML CFDI (INGRESOS)
  const processXMLCFDI = async (xmlFile: File) => {
    try {
      console.log('📄 Procesando XML CFDI de ingreso:', xmlFile.name);
      
      // Leer contenido del XML
      const xmlContent = await xmlFile.text();
      
      // Parsear XML con cfdiXmlParser
      const cfdiData = await parseCFDIXml(xmlContent);
      console.log('✅ CFDI parseado:', cfdiData);
      
      // Convertir a formato de ingreso
      const incomeData = cfdiToIncomeData(cfdiData);
      console.log('✅ Datos de ingreso:', incomeData);
      
      // Auto-rellenar formulario
      setFormData(prev => ({
        ...prev,
        ...incomeData,
        evento_id: eventId
      }));
      
      toast.success(
        `✅ XML CFDI procesado exitosamente\n` +
        `Cliente: ${cfdiData.receptor.nombre}\n` +
        `Total: $${cfdiData.total.toFixed(2)}`
      );
      
    } catch (error: any) {
      console.error('❌ Error procesando XML CFDI:', error);
      toast.error(`Error procesando XML: ${error.message || 'Error desconocido'}`);
    }
  };

  // 🆕 FUNCIÓN PRINCIPAL: Procesar XML + PDF simultáneamente
  const processDocuments = async () => {
    try {
      // ⚠️ Sin archivos
      if (!xmlFile && !pdfFile) {
        console.warn('⚠️ No hay archivos para procesar');
        toast.error('Por favor sube el XML CFDI y el PDF de la factura');
        return;
      }

      // ⚠️ Sin XML: Ingresos requieren factura formal con XML
      if (!xmlFile) {
        console.warn('⚠️ Sin XML - Los ingresos requieren XML CFDI');
        toast.error('⚠️ Los ingresos requieren el XML CFDI de la factura');
        return;
      }

      // 🎯 PRIORIDAD 1: Si hay XML, extraer datos de ahí (100% preciso)
      console.log('✅ XML detectado - Extrayendo datos del XML (sin OCR)');
      
      await processXMLCFDI(xmlFile);
      
      // 📎 Subir PDF si está disponible
      if (pdfFile) {
        console.log('📎 Subiendo PDF:', pdfFile.name);
        const uploadResult = await uploadFile({ file: pdfFile, type: 'income', eventId });
        
        // ✅ Actualizar formData con URL del archivo subido
        setFormData(prev => ({
          ...prev,
          archivo_adjunto: uploadResult.url,
          archivo_nombre: uploadResult.fileName,
          archivo_tamaño: uploadResult.fileSize,
          archivo_tipo: uploadResult.mimeType
        }));
        
        console.log('✅ PDF subido exitosamente:', uploadResult.url);
        toast.success('✅ XML procesado + PDF adjunto correctamente');
      } else {
        toast.success('✅ XML procesado correctamente');
      }

    } catch (error) {
      console.error('❌ Error procesando documentos:', error);
      toast.error('Error procesando documentos');
    }
  };

  const handleOCRFile = async (file: File) => {
    try {
      console.log('🔍 Procesando archivo OCR para prellenar formulario de ingreso:', file.name);
      
      const result = await processOCRFile(file);
      
      if (result.formData._documentType !== 'factura') {
        alert('⚠️ Este documento parece ser un ticket. Use el formulario de gastos para tickets.');
        return;
      }

      // Prellenar formulario con datos OCR
      const ocrData = result.formData;
      setFormData(prev => ({
        ...prev,
        concepto: ocrData.concepto || prev.concepto,
        descripcion: ocrData.descripcion || prev.descripcion,
        total: ocrData.total || prev.total, // ✅ Solo el total importa
        fecha_ingreso: ocrData.fecha_ingreso || prev.fecha_ingreso,
        referencia: ocrData.referencia || prev.referencia,
        // Marcar como facturado si viene de OCR de factura
        facturado: true,
        fecha_facturacion: ocrData.fecha_ingreso || prev.fecha_facturacion,
        // Agregar notas sobre confianza OCR
        metodo_cobro: `OCR (${result.confidence}% confianza)${result.needsValidation ? ' - REVISAR' : ''}`
      }));

      // Subir archivo también
      if (file) {
        const uploadResult = await uploadFile({ file, type: 'income', eventId });
        handleFileUploaded(uploadResult);
      }

      alert(`✅ Datos de factura extraídos automáticamente!\n📊 Confianza: ${result.confidence}%\n${result.needsValidation ? '⚠️ Revise los datos extraídos antes de guardar.' : '✅ Alta confianza, datos listos para usar.'}`);
      
    } catch (error) {
      console.error('❌ Error procesando OCR:', error);
      alert('❌ Error al procesar la factura con OCR. Intente de nuevo o llene el formulario manualmente.');
    }
  };

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-green-900 mb-6 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        {income ? 'Editar Ingreso' : 'Nuevo Ingreso'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 📎 SECCIÓN DE ARCHIVOS - SISTEMA DUAL XML + PDF (SOLO FACTURAS) */}
        <div className="mb-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos de la Factura
            </div>
          </label>

          {/* 🆕 ZONA 1: XML CFDI (Facturas que emitimos) */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-700 font-bold">📄</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">XML CFDI (Factura Emitida)</h3>
                <p className="text-xs text-gray-600">Factura electrónica que emitiste al cliente - 100% precisa</p>
              </div>
            </div>

            {!xmlFile && (
              <div className="relative">
                <input
                  type="file"
                  id="xmlInput"
                  accept=".xml,text/xml,application/xml"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      console.log('📄 XML seleccionado:', selectedFile.name);
                      setXmlFile(selectedFile);
                    }
                  }}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="xmlInput"
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-purple-700 font-medium">
                    Click o arrastra XML aquí
                  </span>
                </label>
              </div>
            )}

            {/* Mostrar XML cargado */}
            {xmlFile && (
              <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-700" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {xmlFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        XML CFDI • {(xmlFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🗑️ Eliminando XML');
                      setXmlFile(null);
                    }}
                    className="px-2 py-1 text-xs text-purple-700 hover:bg-purple-200 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🆕 ZONA 2: PDF (Respaldo visual de la factura) */}
          <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-bold">📄</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">PDF (Respaldo Visual)</h3>
                <p className="text-xs text-gray-600">
                  Archivo PDF de la factura emitida
                </p>
              </div>
            </div>

            {!pdfFile && (
              <div className="relative">
                <input
                  type="file"
                  id="pdfInput"
                  accept="application/pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      console.log('📄 PDF seleccionado:', selectedFile.name);
                      setPdfFile(selectedFile);
                    }
                  }}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="pdfInput"
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-green-300 rounded-lg cursor-pointer hover:bg-green-100/50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Click o arrastra PDF aquí
                  </span>
                </label>
              </div>
            )}

            {/* Mostrar PDF cargado */}
            {pdfFile && (
              <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-700" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(pdfFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🗑️ Eliminando PDF');
                      setPdfFile(null);
                    }}
                    className="px-2 py-1 text-xs text-green-700 hover:bg-green-200 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ⚠️ Error de archivo faltante */}
          {errors.archivo_adjunto && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ❌ {errors.archivo_adjunto}
              </p>
            </div>
          )}

          {/* 💡 Mensaje informativo */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong>⚠️ Importante:</strong> Los ingresos requieren factura formal con XML CFDI. No se aceptan tickets sin XML.
            </p>
          </div>

          {/* 🚀 BOTÓN PARA PROCESAR DOCUMENTOS */}
          {(xmlFile || pdfFile) && (
            <div>
              <button
                type="button"
                onClick={processDocuments}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-green-600 text-white font-semibold rounded-lg shadow-md hover:from-purple-700 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                disabled={isSubmitting || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subiendo archivos...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {xmlFile && pdfFile && '🎯 Procesar XML + PDF'}
                    {xmlFile && !pdfFile && '📄 Extraer Datos del XML'}
                    {!xmlFile && pdfFile && '⚠️ Requiere XML CFDI'}
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-600 mt-2">
                ⚡ Click aquí primero para extraer datos y subir archivos
              </p>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <input
              type="text"
              value={formData.concepto}
              onChange={(e) => handleInputChange('concepto', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.concepto ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Descripción del servicio o producto facturado"
              disabled={isSubmitting}
            />
            {errors.concepto && (
              <p className="text-red-600 text-sm mt-1">{errors.concepto}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total de la Factura (con IVA) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.total}
                onChange={(e) => handleInputChange('total', parseFloat(e.target.value) || 0)}
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.total ? 'border-red-500' : 'border-gray-300'
                }`}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>
            {errors.total && (
              <p className="text-red-600 text-sm mt-1">{errors.total}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              El total del XML CFDI ya incluye descuentos e IVA
            </p>
          </div>
          
          {/* ====== CLIENTE (OBLIGATORIO) ====== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Cliente *
            </label>
            <select
              value={formData.cliente_id}
              onChange={(e) => {
                const selectedCliente = clients?.find(c => c.id === parseInt(e.target.value));
                handleInputChange('cliente_id', e.target.value);
                if (selectedCliente) {
                  handleInputChange('cliente', selectedCliente.nombre);
                  handleInputChange('rfc_cliente', selectedCliente.rfc || '');
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.cliente_id ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting || loadingClients}
            >
              <option value="">Selecciona un cliente</option>
              {clients?.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.rfc ? `- ${cliente.rfc}` : ''}
                </option>
              ))}
            </select>
            {errors.cliente_id && (
              <p className="text-red-500 text-sm mt-1">{errors.cliente_id}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ℹ️ El cliente es obligatorio para poder facturar este ingreso
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Responsable del Seguimiento
            </label>
            <select
              value={formData.responsable_id}
              onChange={(e) => handleInputChange('responsable_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSubmitting || loadingUsers}
            >
              <option value="">-- Sin asignar --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Trabajador que dará seguimiento al cobro
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IVA (%)
            </label>
            <input
              type="number"
              value={formData.iva_porcentaje}
              onChange={(e) => handleInputChange('iva_porcentaje', parseFloat(e.target.value) || MEXICAN_CONFIG.ivaRate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
              max="100"
              step="0.01"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Ingreso *
            </label>
            <input
              type="date"
              value={formData.fecha_ingreso}
              onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.fecha_ingreso ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.fecha_ingreso && (
              <p className="text-red-600 text-sm mt-1">{errors.fecha_ingreso}</p>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Cobro
            </label>
            <select
              value={formData.metodo_cobro}
              onChange={(e) => handleInputChange('metodo_cobro', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia
            </label>
            <input
              type="text"
              value={formData.referencia}
              onChange={(e) => handleInputChange('referencia', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Número de factura, folio, etc."
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Detalles adicionales del ingreso..."
            disabled={isSubmitting}
          />
        </div>

        {/* Calculation Summary */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Resumen de Cálculo
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({formData.iva_porcentaje}%):</span>
              <span className="font-medium">{formatCurrency(iva)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span className="text-green-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Management Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Gestión de Pagos y Facturación
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Facturación *
              </label>
              <input
                type="date"
                value={formData.fecha_facturacion}
                onChange={(e) => handleInputChange('fecha_facturacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Fecha de emisión de la factura
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días de Crédito *
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.dias_credito}
                onChange={(e) => handleInputChange('dias_credito', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Días para el pago (30, 60, 90, etc.)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento {formData.facturado && '*'}
              </label>
              <input
                type="date"
                value={formData.fecha_compromiso_pago}
                onChange={(e) => handleInputChange('fecha_compromiso_pago', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                  errors.fecha_compromiso_pago ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                readOnly
              />
              {errors.fecha_compromiso_pago && (
                <p className="text-red-600 text-sm mt-1">{errors.fecha_compromiso_pago}</p>
              )}
              <p className="text-xs text-blue-600 mt-1">
                ✓ Calculado automáticamente
              </p>
            </div>
            
            {formData.cobrado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Cobro *
                </label>
                <input
                  type="date"
                  value={formData.fecha_cobro}
                  onChange={(e) => handleInputChange('fecha_cobro', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_cobro ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.fecha_cobro && (
                  <p className="text-red-600 text-sm mt-1">{errors.fecha_cobro}</p>
                )}
              </div>
            )}
          </div>

          {/* ✅ Sección de comprobante de pago (solo visible cuando está cobrado) */}
          {formData.cobrado && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="text-sm font-medium text-green-900 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Comprobante de Pago *
              </h5>
              
              {!formData.documento_pago_url ? (
                <div>
                  <input
                    type="file"
                    id="comprobantePagoInput"
                    accept="application/pdf,image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Subir archivo directamente a Supabase Storage
                          const fileName = `comprobante_pago_${Date.now()}_${file.name}`;
                          const filePath = `evt_${eventId}_comprobantes/${fileName}`;
                          
                          // TODO: Implementar upload a Supabase Storage
                          // Por ahora, solo guardamos el nombre del archivo
                          setFormData(prev => ({
                            ...prev,
                            documento_pago_url: filePath,
                            documento_pago_nombre: file.name
                          }));
                          
                          // Limpiar error si existe
                          if (errors.documento_pago_url) {
                            setErrors(prev => ({ ...prev, documento_pago_url: '' }));
                          }
                          toast.success('✅ Comprobante de pago registrado');
                        } catch (err) {
                          console.error('Error al procesar comprobante:', err);
                          toast.error('❌ Error al procesar comprobante');
                        }
                      }
                    }}
                    className="hidden"
                    disabled={isSubmitting || isUploading}
                  />
                  <label
                    htmlFor="comprobantePagoInput"
                    className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      errors.documento_pago_url 
                        ? 'border-red-500 bg-red-50 hover:bg-red-100' 
                        : 'border-green-300 bg-white hover:bg-green-50'
                    }`}
                  >
                    <Upload className={`w-5 h-5 ${errors.documento_pago_url ? 'text-red-600' : 'text-green-600'}`} />
                    <span className={`text-sm font-medium ${errors.documento_pago_url ? 'text-red-700' : 'text-green-700'}`}>
                      {isUploading ? 'Subiendo...' : 'Subir comprobante de pago'}
                    </span>
                  </label>
                  {errors.documento_pago_url && (
                    <p className="text-red-600 text-xs mt-2">{errors.documento_pago_url}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">
                    Documento que comprueba que el pago fue recibido (PDF o imagen)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-700" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formData.documento_pago_nombre}
                      </p>
                      <p className="text-xs text-green-600">
                        ✓ Comprobante cargado
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        documento_pago_url: '',
                        documento_pago_nombre: ''
                      }));
                    }}
                    className="px-3 py-1 text-xs text-red-700 hover:bg-red-100 rounded"
                    disabled={isSubmitting}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Checkboxes */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Estado del Ingreso</h4>
          
          {/* ℹ️ Mensaje informativo sobre el flujo */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>📋 Flujo de Ingresos:</strong> Los ingresos siempre comienzan con factura emitida. 
              Marca como "Cobrado" cuando recibas el pago y sube el comprobante correspondiente.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2 opacity-75 cursor-not-allowed">
              <input
                type="checkbox"
                checked={formData.facturado}
                onChange={(e) => handleInputChange('facturado', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                disabled={true}
              />
              <div>
                <span className="text-sm text-gray-700">✓ Facturado</span>
                <p className="text-xs text-gray-500">Los ingresos siempre tienen factura</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.cobrado}
                onChange={(e) => handleInputChange('cobrado', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                disabled={isSubmitting}
              />
              <div>
                <span className="text-sm text-gray-700">Cobrado</span>
                <p className="text-xs text-gray-500">Marca cuando recibas el pago</p>
              </div>
            </label>
          </div>
          
          {/* Payment Status Indicator */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">Estado actual: </span>
              <span className={`font-medium ${
                formData.cobrado ? 'text-green-600' :
                formData.facturado ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {formData.cobrado ? 'Pagado' :
                 formData.facturado ? 'Facturado (Pendiente de pago)' : 'Sin facturar'}
              </span>
            </div>
            {formData.facturado && !formData.cobrado && formData.fecha_compromiso_pago && (
              <div className="text-xs text-gray-500 mt-1">
                Compromiso de pago: {new Date(formData.fecha_compromiso_pago).toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || isUploading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading || !formData.archivo_adjunto}
            className="bg-green-500 hover:bg-green-600"
          >
            {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {income ? 'Actualizar' : 'Crear'} Ingreso
          </Button>
        </div>
      </form>
    </div>
  );
};