import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, MapPin, FileText, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { EventDocumentUpload } from './documents/EventDocumentUpload';
import { supabase } from '../../../core/config/supabase';
import { formatDate } from '../../../shared/utils/formatters';
import { useEventStates } from '../hooks/useEventStates'; // This will be used indirectly
import { useEventStateValidation } from '../hooks/useEventStateValidation';
import { EventWorkflowVisualization } from './workflow/EventWorkflowVisualization';

interface EventoModalProps {
  evento?: any;
  onClose: () => void;
  onSave: () => void;
}

export const EventoModal: React.FC<EventoModalProps> = ({ evento, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const [eventDocuments, setEventDocuments] = useState<any[]>([]);
  
  const { data: states } = useEventStates();
  const { // This hook now comes from the new central file
    nextValidState,
    validateAdvancement
  } = useEventStateValidation(evento?.id?.toString() || '');
  
  const [formData, setFormData] = useState({
    nombre: evento?.nombre || '',
    descripcion: evento?.descripcion || '',
    fecha_evento: evento?.fecha_evento ? evento.fecha_evento.split('T')[0] : '',
    hora_inicio: evento?.hora_inicio || '',
    hora_fin: evento?.hora_fin || '',
    ubicacion: evento?.ubicacion || '',
    cliente_id: evento?.cliente_id || '',
    responsable_id: evento?.responsable_id || '',
    solicitante_id: evento?.solicitante_id || '',
    estado_id: evento?.estado_id || 1,
    status_evento: evento?.status_evento || 'planificacion',
    status_pago: evento?.status_pago || 'pendiente_facturar',
    presupuesto_estimado: evento?.presupuesto_estimado || 0,
    notas: evento?.notas || ''
  });

  const canUploadDocuments = () => {
    const currentState = states?.find(s => s.id === formData.estado_id);
    const allowedStates = ['Acuerdo', 'Orden de Compra', 'Cancelado'];
    return currentState && allowedStates.includes(currentState.nombre);
  };

  const handleDocumentUploaded = (document: any) => {
    setEventDocuments(prev => [...prev, document]);
  };

  const handleDocumentRemoved = (documentId: string) => {
    setEventDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClientes();
    loadUsuarios();
  }, []);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('evt_clientes')
        .select('id, razon_social, nombre_comercial, sufijo')
        .eq('activo', true)
        .order('razon_social');

      if (error) {
        console.error('Error loading clientes:', error);
        setClientes([]);
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
      setClientes([]);
    }
  };

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('core_users')
        .select('id, nombre, email')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Error loading usuarios:', error);
        throw error;
      }

      console.log('✅ Usuarios cargados:', data?.length || 0, data);
      setUsuarios(data || []);
    } catch (error) {
      console.error('❌ Error loading usuarios:', error);
      setUsuarios([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del evento es requerido';
    }

    if (!formData.fecha_evento) {
      newErrors.fecha_evento = 'La fecha del evento es requerida';
    }

    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Debe seleccionar un cliente';
    }

    if (!formData.responsable_id) {
      newErrors.responsable_id = 'Debe asignar un responsable';
    }

    if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Validate state change if editing
    if (evento && formData.estado_id !== evento.estado_id) {
      const validation = await validateAdvancement(formData.estado_id);
      if (!validation.valid) {
        setValidationError(validation.errors.join('. '));
        return;
      }
    }
    setLoading(true);

    try {
      // Clean up form data before saving
      const cleanedData = {
        ...formData,
        hora_inicio: formData.hora_inicio || null,
        hora_fin: formData.hora_fin || null,
        presupuesto_estimado: parseFloat(formData.presupuesto_estimado.toString()) || 0,
        estado_id: parseInt(formData.estado_id.toString()) || 1
      };
      
      onSave(cleanedData);
    } catch (error) {
      console.error('Error al guardar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'estado_id') {
      setValidationError('');
    }
  };

  const currentState = states?.find(s => s.id === formData.estado_id);
  const isStateCancelado = currentState?.nombre.toLowerCase() === 'cancelado';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={evento ? 'Editar Evento' : 'Nuevo Evento'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Validation Error */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Error de Validación</h4>
                <p className="text-red-700 text-sm mt-1">{validationError}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Current State Visualization (for editing) */}
        {evento && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Estado Actual del Evento</h3>
            <EventWorkflowVisualization
              currentStateId={formData.estado_id}
              showProgress={true}
              interactive={false}
            />
          </div>
        )}

        {/* Información básica */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Información del Evento
          </h3>

          {/* Info sobre clave de evento si es nuevo */}
          {!evento && formData.cliente_id && (
            <div className="mb-4 p-3 bg-mint-50 border border-mint-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-mint-600" />
                <span className="text-sm text-mint-800">
                  <strong>Clave del evento:</strong> Se generará automáticamente usando el sufijo del cliente: <strong>{clientes.find(c => c.id === formData.cliente_id)?.sufijo || '???'}{new Date().getFullYear()}-###</strong>
                </span>
              </div>
              <p className="text-xs text-mint-700 mt-1 ml-6">
                Ejemplo: {clientes.find(c => c.id === formData.cliente_id)?.sufijo || 'ABC'}{new Date().getFullYear()}-001
              </p>
            </div>
          )}

          {/* Mostrar clave existente si es edición */}
          {evento && evento.clave_evento && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Clave del evento:</strong> {evento.clave_evento}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Conferencia Anual de Tecnología"
              />
              {errors.nombre && (
                <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Evento *
              </label>
              <input
                type="date"
                value={formData.fecha_evento}
                onChange={(e) => handleInputChange('fecha_evento', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent ${
                  errors.fecha_evento ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fecha_evento && (
                <p className="text-red-600 text-sm mt-1">{errors.fecha_evento}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                placeholder="Centro de Convenciones, Hotel, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Fin
              </label>
              <input
                type="time"
                value={formData.hora_fin}
                onChange={(e) => handleInputChange('hora_fin', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent ${
                  errors.hora_fin ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hora_fin && (
                <p className="text-red-600 text-sm mt-1">{errors.hora_fin}</p>
              )}
            </div>
          </div>
        </div>

        {/* Asignación y Cliente */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Cliente y Asignación
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                value={formData.cliente_id}
                onChange={(e) => handleInputChange('cliente_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent ${
                  errors.cliente_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre_comercial || cliente.razon_social}
                  </option>
                ))}
              </select>
              {errors.cliente_id && (
                <p className="text-red-600 text-sm mt-1">{errors.cliente_id}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable *
              </label>
              <select
                value={formData.responsable_id}
                onChange={(e) => handleInputChange('responsable_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent ${
                  errors.responsable_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar responsable...</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
              {errors.responsable_id && (
                <p className="text-red-600 text-sm mt-1">{errors.responsable_id}</p>
              )}
            </div>

            <div className="bg-red-100 border-4 border-red-600 p-4 rounded-xl shadow-xl">
              <label className="block text-3xl font-extrabold text-red-900 mb-3 uppercase text-center animate-pulse">
                🔴🔴🔴 SOLICITANTE 🔴🔴🔴
              </label>
              <select
                value={formData.solicitante_id}
                onChange={(e) => handleInputChange('solicitante_id', e.target.value)}
                className="w-full px-4 py-4 text-xl font-bold border-4 border-red-600 rounded-lg focus:ring-4 focus:ring-red-500 bg-white shadow-lg"
              >
                <option value="">⬇️ SELECCIONAR SOLICITANTE ⬇️</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    👤 {usuario.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estado y presupuesto */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Estado y Presupuesto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Evento *
              </label>
              <select
                value={formData.estado_id}
                onChange={(e) => handleInputChange('estado_id', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent ${
                  isStateCancelado ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                }`}
                disabled={isStateCancelado}
              >
                <option value="">Seleccionar estado...</option>
                {states?.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.nombre}
                  </option>
                ))}
              </select>
              {isStateCancelado && (
                <p className="text-yellow-600 text-sm mt-1">
                  Los eventos cancelados no pueden cambiar de estado
                </p>
              )}
              {currentState && (
                <div className="mt-2 flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentState.color || '#74F1C8' }}
                  />
                  <span className="text-sm text-gray-600">{currentState.descripcion}</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado de Pago
              </label>
              <select
                value={formData.status_pago}
                onChange={(e) => handleInputChange('status_pago', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
              >
                <option value="pendiente_facturar">Pendiente Facturar</option>
                <option value="facturado">Facturado</option>
                <option value="pago_pendiente">Pago Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presupuesto Estimado ($)
              </label>
              <input
                type="number"
                value={formData.presupuesto_estimado}
                onChange={(e) => handleInputChange('presupuesto_estimado', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          {/* State Advancement Helper */}
          {evento && nextValidState && !isStateCancelado && (
            <div className="mt-4 p-3 bg-mint-50 border border-mint-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: nextValidState.color || '#74F1C8' }}
                />
                <span className="text-sm text-mint-800">
                  Siguiente estado disponible: <strong>{nextValidState.nombre}</strong>
                </span>
              </div>
              <p className="text-xs text-mint-700 mt-1">
                {nextValidState.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Descripción y notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            placeholder="Descripción detallada del evento..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas Adicionales
          </label>
          <textarea
            value={formData.notas}
            onChange={(e) => handleInputChange('notas', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
            placeholder="Notas internas, recordatorios, etc."
          />
        </div>

        {/* Document Upload Section */}
        {evento && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Documentos del Evento</h4>
            <EventDocumentUpload
              eventId={evento.id}
              currentDocuments={eventDocuments}
              onDocumentUploaded={handleDocumentUploaded}
              onDocumentRemoved={handleDocumentRemoved}
            />
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-mint-500 hover:bg-mint-600"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {evento ? 'Actualizar Evento' : 'Crear Evento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};