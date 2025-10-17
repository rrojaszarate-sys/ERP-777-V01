import React, { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/Button';
import { EventDocumentUpload } from '../documents/EventDocumentUpload';
import { EventWorkflowVisualization } from '../workflow/EventWorkflowVisualization';
import { useEventTypes } from '../../hooks/useEventTypes';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../../../core/auth/AuthProvider';
import { EventoCompleto, Cliente } from '../../types/Event';

interface EventFormProps {
  event?: EventoCompleto | null;
  clients: Cliente[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  clients,
  onSave,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [eventDocuments, setEventDocuments] = useState<any[]>([]);
  const { data: eventTypes = [] } = useEventTypes();
  const { data: users = [] } = useUsers();
  const { user } = useAuth();

  const [showClientChangeWarning, setShowClientChangeWarning] = useState(false);
  const [newEventKey, setNewEventKey] = useState('');

  const [formData, setFormData] = useState({
    nombre_proyecto: event?.nombre_proyecto || '',
    descripcion: event?.descripcion || '',
    fecha_evento: event?.fecha_evento ? event.fecha_evento.split('T')[0] : '',
    fecha_fin: event?.fecha_fin ? event.fecha_fin.split('T')[0] : '',
    cliente_id: event?.cliente_id || '',
    responsable_id: event?.responsable_id || '',
    solicitante_id: event?.solicitante_id || '',
    tipo_evento_id: event?.tipo_evento_id || '',
    estado_id: event?.estado_id || 1,
    presupuesto_estimado: event?.presupuesto_estimado || 0,
    notas: event?.notas || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAdmin = user?.role === 'Administrador';
  const isEditingEvent = !!event;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre_proyecto.trim())
      newErrors.nombre_proyecto = 'El nombre del proyecto es requerido';
    if (!formData.fecha_evento)
      newErrors.fecha_evento = 'La fecha del evento es requerida';
    if (!formData.cliente_id)
      newErrors.cliente_id = 'Debe seleccionar un cliente';
    if (!formData.tipo_evento_id)
      newErrors.tipo_evento_id = 'Debe seleccionar un tipo de evento';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      onSave({
        ...formData,
        presupuesto_estimado:
          parseFloat(formData.presupuesto_estimado.toString()) || 0,
        estado_id: formData.estado_id || 1,
      });
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generar preview de nueva clave cuando cambie el cliente
  useEffect(() => {
    if (isEditingEvent && formData.cliente_id && formData.cliente_id !== event?.cliente_id) {
      const cliente = clients.find(c => c.id === formData.cliente_id);
      if (cliente?.sufijo) {
        const year = new Date().getFullYear();
        setNewEventKey(`${cliente.sufijo}${year}-###`);
        setShowClientChangeWarning(true);
      }
    } else {
      setShowClientChangeWarning(false);
      setNewEventKey('');
    }
  }, [formData.cliente_id, event?.cliente_id, clients, isEditingEvent]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Estado del Evento */}
      {event && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            Estado Actual del Evento
          </h3>
          <EventWorkflowVisualization
            currentStateId={formData.estado_id}
            showProgress
            interactive={false}
          />
        </div>
      )}

      {/* Información del Evento */}
      <div className="bg-blue-50 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-medium text-blue-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2" /> Información del Evento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              value={formData.nombre_proyecto}
              onChange={(e) =>
                handleInputChange('nombre_proyecto', e.target.value)
              }
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.nombre_proyecto ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Conferencia Anual de Tecnología 2025"
            />
            {errors.nombre_proyecto && (
              <p className="text-red-600 text-sm mt-1">
                {errors.nombre_proyecto}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={formData.fecha_evento}
              onChange={(e) => handleInputChange('fecha_evento', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.fecha_evento ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fecha_evento && (
              <p className="text-red-600 text-sm mt-1">
                {errors.fecha_evento}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Fin
            </label>
            <input
              type="date"
              value={formData.fecha_fin}
              onChange={(e) => handleInputChange('fecha_fin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Evento *
            </label>
            <select
              value={formData.tipo_evento_id}
              onChange={(e) =>
                handleInputChange('tipo_evento_id', e.target.value)
              }
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.tipo_evento_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar tipo...</option>
              {eventTypes.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errors.tipo_evento_id && (
              <p className="text-red-600 text-sm mt-1">
                {errors.tipo_evento_id}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Advertencia de cambio de cliente */}
      {showClientChangeWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h4 className="text-yellow-800 font-medium">⚠️ Advertencia: Cambio de Cliente</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Al cambiar el cliente, se generará una <strong>nueva clave de evento</strong>:
              </p>
              <div className="mt-2 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 font-mono text-yellow-900">
                Clave anterior: <strong>{event?.clave_evento}</strong> → Nueva clave: <strong>{newEventKey}</strong>
              </div>
              <p className="text-yellow-700 text-xs mt-2">
                Esta acción solo puede ser realizada por administradores y afectará la trazabilidad del evento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cliente y Responsable */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-green-900 flex items-center">
          <User className="w-5 h-5 mr-2" /> Cliente y Asignación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente * {isEditingEvent && !isAdmin && <Lock className="inline w-4 h-4 ml-1 text-gray-500" />}
            </label>
            <select
              value={formData.cliente_id}
              onChange={(e) =>
                handleInputChange('cliente_id', parseInt(e.target.value) || '')
              }
              disabled={isEditingEvent && !isAdmin}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.cliente_id ? 'border-red-500' : 'border-gray-300'
              } ${isEditingEvent && !isAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
              title={isEditingEvent && !isAdmin ? 'Solo los administradores pueden cambiar el cliente' : ''}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre_comercial || cliente.razon_social}
                </option>
              ))}
            </select>
            {errors.cliente_id && (
              <p className="text-red-600 text-sm mt-1">{errors.cliente_id}</p>
            )}
            {isEditingEvent && !isAdmin && (
              <p className="text-gray-500 text-xs mt-1 flex items-center">
                <Lock className="w-3 h-3 mr-1" />
                Solo administradores pueden cambiar el cliente
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable
            </label>
            <select
              value={formData.responsable_id}
              onChange={(e) =>
                handleInputChange('responsable_id', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar responsable...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solicitante
            </label>
            <select
              value={formData.solicitante_id}
              onChange={(e) =>
                handleInputChange('solicitante_id', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Seleccionar solicitante...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} ({user.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gestión del Proyecto */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-purple-900 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" /> Gestión del Proyecto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Presupuesto Estimado ($)
            </label>
            <input
              type="number"
              value={formData.presupuesto_estimado}
              onChange={(e) =>
                handleInputChange(
                  'presupuesto_estimado',
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Descripción y Notas */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción del Evento
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Descripción detallada del evento..."
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas Internas
        </label>
        <textarea
          value={formData.notas}
          onChange={(e) => handleInputChange('notas', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Notas internas, recordatorios..."
        />
      </div>

      {/* Documentos */}
      {event && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Documentos del Evento</h4>
          <EventDocumentUpload
            eventId={event.id}
            currentDocuments={eventDocuments}
            onDocumentUploaded={(doc) =>
              setEventDocuments((prev) => [...prev, doc])
            }
            onDocumentRemoved={(id) =>
              setEventDocuments((prev) =>
                prev.filter((doc) => doc.id !== id)
              )
            }
          />
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
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
          {event ? 'Actualizar Evento' : 'Crear Evento'}
        </Button>
      </div>
    </form>
  );
};
