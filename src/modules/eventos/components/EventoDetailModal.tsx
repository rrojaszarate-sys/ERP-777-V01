import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, MapPin, TrendingUp, TrendingDown, Plus, CreditCard as Edit, Trash2, Eye, X, Paperclip, Settings, XCircle, CheckCircle, Loader2, Workflow } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../shared/components/ui/Modal';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { EventWorkflowVisualization } from './workflow/EventWorkflowVisualization';
import { supabase } from '../../../core/config/supabase';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { usePermissions } from '../../../core/permissions/usePermissions';
import { StateAdvancementManager } from './workflow/StateAdvancementManager';
import { useEventStates } from '../hooks/useEventStates';
import { fileUploadService } from '../../../services/fileUploadService';
import { formatFileSize } from '../../../shared/utils/formatters';
import { workflowService } from '../services/workflowService';
import { useAuth } from '../../../core/auth/AuthProvider';
import toast from 'react-hot-toast';

interface EventoDetailModalProps {
  eventoId: number;
  onClose: () => void;
  onEdit: (evento: any) => void;
  onRefresh: () => void;
}

export const EventoDetailModal: React.FC<EventoDetailModalProps> = ({
  eventoId, 
  onClose,
  onEdit,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingresos' | 'gastos' | 'workflow'>('overview');
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventDocuments, setEventDocuments] = useState<any[]>([]);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const { canUpdate, canDelete } = usePermissions();
  const { data: estados } = useEventStates();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: evento, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['evento', eventoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_eventos_completos')
        .select('*, cliente:evt_clientes(*), responsable:core_users(*), estado:evt_estados(*)')
        .eq('id', eventoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventoId,
  });

  useEffect(() => {
    if (evento) {
      loadFinancialData();
    }
  }, [evento]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { data: ingresosData, error: ingresosError } = await supabase
        .from('evt_ingresos')
        .select('*')
        .eq('evento_id', evento.id)
        .order('created_at', { ascending: false });

      if (ingresosError) throw ingresosError;
      setIngresos(ingresosData || []);

      const { data: gastosData, error: gastosError } = await supabase
        .from('evt_gastos')
        .select(`
          *,
          categoria:evt_categorias_gastos(nombre, color)
        `)
        .eq('evento_id', evento.id)
        .order('created_at', { ascending: false });

      if (gastosError) throw gastosError;
      setGastos(gastosData || []);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionInWorkflow = (newStateName?: string) => {
    const message = newStateName
      ? `🎉 Estado avanzado a: ${newStateName}`
      : 'Acción completada. Refrescando estado del evento...';
    toast.success(message);
    // Invalida la query para este evento específico para obtener datos frescos
    queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
    onRefresh(); // Also refresh the main list
  };

  const handleCancelEvent = async () => {
    if (!user) return;
    if (window.confirm('¿Estás seguro de que deseas cancelar este evento? Esta acción no se puede deshacer.')) {
      setIsCanceling(true);
      try {
        const reason = prompt('Por favor, introduce un motivo para la cancelación:');
        if (reason) {
          await workflowService.cancelEvent(evento.id, user.id, reason);
          toast.success('Evento cancelado correctamente.');
          onRefresh();
          onClose();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al cancelar el evento.');
        // Aquí podrías mostrar una notificación de error al usuario
      } finally {
        setIsCanceling(false);
      }
    }
  };

  const handleFinalizeEvent = async () => {
    if (!user) return;
    if (window.confirm('¿Estás seguro de que deseas finalizar este evento?')) {
      setIsFinalizing(true);
      try {
        await workflowService.finalizeEvent(evento.id, user.id, 'Evento finalizado desde el modal de detalles.');
        toast.success('Evento finalizado correctamente.');
        onRefresh();
      } catch (error) {
        console.error('Error al finalizar el evento:', error);
        // Aquí podrías mostrar una notificación de error al usuario
      } finally {
        setIsFinalizing(false);
      }
    }
  };

  if (isLoadingEvent || !evento) {
    return <div className="p-6 text-center">Cargando detalles del evento...</div>;
  }

  const getCurrentState = () => {
    return estados?.find(estado => estado.id === evento.estado_id);
  };
  const totalIngresos = ingresos.reduce((sum, ing) => sum + (ing.total || 0), 0);
  const totalGastos = gastos.reduce((sum, gasto) => sum + (gasto.total || 0), 0);
  const utilidad = totalIngresos - totalGastos;

  const getStatusBadge = (status: string, type: 'evento' | 'pago') => {
    if (type === 'evento') {
      const variants = {
        'planificacion': 'warning',
        'confirmado': 'info',
        'en_progreso': 'info',
        'completado': 'success',
        'cancelado': 'danger'
      };
      
      const labels = {
        'planificacion': 'Planificación',
        'confirmado': 'Confirmado',
        'en_progreso': 'En Progreso',
        'completado': 'Completado',
        'cancelado': 'Cancelado'
      };
      
      return (
        <Badge variant={variants[status as keyof typeof variants] as any}>
          {labels[status as keyof typeof labels]}
        </Badge>
      );
    } else {
      const variants = {
        'pendiente_facturar': 'warning',
        'facturado': 'info',
        'pago_pendiente': 'warning',
        'pagado': 'success'
      };
      
      const labels = {
        'pendiente_facturar': 'Pendiente Facturar',
        'facturado': 'Facturado',
        'pago_pendiente': 'Pago Pendiente',
        'pagado': 'Pagado'
      };
      
      return (
        <Badge variant={variants[status as keyof typeof variants] as any}>
          {labels[status as keyof typeof labels]}
        </Badge>
      );
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Eye },
    { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
    { id: 'gastos', label: 'Gastos', icon: TrendingDown },
    { id: 'workflow', label: 'Workflow', icon: Settings }
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Detalle del Evento: ${evento.nombre}`}
      size="full"
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Información General</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(evento.fecha_evento)}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {evento.ubicacion || 'No especificada'}
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {evento.responsable?.nombre || 'Sin asignar'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Estados</h3>
                  <div className="space-y-2">
                    <EventWorkflowVisualization currentStateId={evento.estado_id} compact={true} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Resumen Financiero</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Ingresos:</span>
                      <span className="font-medium text-green-600">{formatCurrency(totalIngresos)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gastos:</span>
                      <span className="font-medium text-red-600">{formatCurrency(totalGastos)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1">
                      <span>Utilidad:</span>
                      <span className={utilidad >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(utilidad)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 ml-6">
              {canUpdate('eventos') && (
                <Button
                  onClick={() => onEdit(evento)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
              {canDelete('eventos') && (
                <Button
                  onClick={handleCancelEvent}
                  variant="danger"
                  size="sm"
                  disabled={isCanceling}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Evento
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-mint-500 text-mint-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.id === 'archivos' && eventDocuments.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    {eventDocuments.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab evento={evento} />
            )}
            
            {activeTab === 'ingresos' && (
              <IngresosTab ingresos={ingresos} evento={evento} onRefresh={loadFinancialData} />
            )}
            
            {activeTab === 'gastos' && (
              <GastosTab gastos={gastos} evento={evento} onRefresh={loadFinancialData} />
            )}
            
            {activeTab === 'workflow' && (
              <WorkflowTab evento={evento} onStateChanged={handleActionInWorkflow} />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div>
            <Button 
              variant="danger" 
              onClick={handleCancelEvent}
              disabled={isCanceling}
              className="mr-2"
            >
              {isCanceling ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2" />}
              Cancelar Evento
            </Button>
            {evento.estado?.nombre !== 'Finalizado' && evento.estado?.nombre !== 'Cancelado' && (
               <Button 
                  variant="outline"
                  onClick={handleFinalizeEvent}
                  disabled={isFinalizing}
               >
                 {isFinalizing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                 Finalizar Evento
               </Button>
            )}
          </div>
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2">Cerrar</Button>
            {canUpdate('eventos') && (
              <Button onClick={() => onEdit(evento)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const OverviewTab: React.FC<{ evento: any }> = ({ evento }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-6"
    >
      {/* Workflow Visualization */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado Actual del Evento</h3>
        <EventWorkflowVisualization
          currentStateId={evento.estado_id}
          showProgress={true}
          interactive={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Evento</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Descripción</label>
              <p className="text-gray-900">{evento.descripcion || 'Sin descripción'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Cliente</label>
              <p className="text-gray-900">{evento.cliente?.razon_social || 'Sin cliente'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Horario</label>
              <p className="text-gray-900">
                {evento.hora_inicio && evento.hora_fin 
                  ? `${evento.hora_inicio} - ${evento.hora_fin}`
                  : 'Sin horario definido'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Presupuesto Estimado</label>
              <p className="text-gray-900">{formatCurrency(evento.presupuesto_estimado || 0)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notas</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {evento.notas || 'Sin notas adicionales'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const IngresosTab: React.FC<{
  ingresos: any[];
  evento: any;
  onRefresh: () => void;
}> = ({ ingresos, evento, onRefresh }) => {
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const handleDelete = async (ingreso: any) => {
    if (confirm(`¿Está seguro de que desea eliminar este ingreso de ${formatCurrency(ingreso.total)}?`)) {
      try {
        const { error } = await supabase
          .from('evt_ingresos')
          .delete()
          .eq('id', ingreso.id);
        
        if (error) throw error;
        onRefresh();
      } catch (error) {
        console.error('Error deleting ingreso:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Ingresos del Evento</h3>
        {canCreate('ingresos') && (
          <Button
            onClick={() => console.log('Create income')}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Ingreso
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {ingresos.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay ingresos registrados</p>
          </div>
        ) : (
          ingresos.map(ingreso => (
            <div key={ingreso.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{ingreso.concepto}</h4>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(ingreso.total)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Fecha: {formatDate(ingreso.created_at)}</p>
                    {ingreso.descripcion && <p>Descripción: {ingreso.descripcion}</p>}
                    {ingreso.referencia && <p>Referencia: {ingreso.referencia}</p>}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {canUpdate('ingresos') && (
                    <Button
                      onClick={() => console.log('Edit income', ingreso.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete('ingresos') && (
                    <Button
                      onClick={() => handleDelete(ingreso)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const GastosTab: React.FC<{
  gastos: any[];
  evento: any;
  onRefresh: () => void;
}> = ({ gastos, evento, onRefresh }) => {
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const handleDelete = async (gasto: any) => {
    if (confirm(`¿Está seguro de que desea eliminar este gasto de ${formatCurrency(gasto.total)}?`)) {
      try {
        const { error } = await supabase
          .from('evt_gastos')
          .update({ 
            deleted_at: new Date().toISOString(),
            activo: false 
          })
          .eq('id', gasto.id);
        
        if (error) throw error;
        onRefresh();
      } catch (error) {
        console.error('Error deleting gasto:', error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Gastos del Evento</h3>
        {canCreate('gastos') && (
          <Button
            onClick={() => console.log('Create expense')}
            className="bg-red-500 hover:bg-red-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Gasto
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {gastos.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay gastos registrados</p>
          </div>
        ) : (
          gastos.map(gasto => (
            <div key={gasto.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{gasto.concepto}</h4>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(gasto.total)}
                    </span>
                    {gasto.categoria && (
                      <Badge 
                        variant="default" 
                        style={{ backgroundColor: gasto.categoria.color + '20', color: gasto.categoria.color }}
                      >
                        {gasto.categoria.nombre}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Fecha: {formatDate(gasto.fecha_gasto)}</p>
                    {gasto.descripcion && <p>Descripción: {gasto.descripcion}</p>}
                    {gasto.proveedor && <p>Proveedor: {gasto.proveedor}</p>}
                    {gasto.referencia && <p>Referencia: {gasto.referencia}</p>}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {canUpdate('gastos') && (
                    <Button
                      onClick={() => console.log('Edit expense', gasto.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete('gastos') && (
                    <Button
                      onClick={() => handleDelete(gasto)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const WorkflowTab: React.FC<{
  evento: any;
  onStateChanged: (newStateName?: string) => void;
}> = ({ evento, onStateChanged }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-6"
    >
      <StateAdvancementManager
        event={evento} // StateAdvancementManager ahora usa DocumentosEvento internamente
        onStateChanged={onStateChanged}
      />
    </motion.div>
  );
};
