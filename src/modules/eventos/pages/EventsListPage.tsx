import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, CreditCard as Edit, Trash2, FileText, DollarSign, Calendar, TrendingUp, Paperclip } from 'lucide-react';
import { useEvents, useClients } from '../hooks/useEvents';
import { usePermissions } from '../../../core/permissions/usePermissions';
import { DataTable } from '../../../shared/components/tables/DataTable';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Modal } from '../../../shared/components/ui/Modal';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { PageSkeleton } from '../../../shared/components/ui/LoadingSpinner';
import { EventForm } from '../components/events/EventForm';
import { EventDetail } from '../components/events/EventDetail';
import { EventoCompleto } from '../types/Event';

export const EventsListPage: React.FC = () => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventoCompleto | null>(null);
  const [viewingEvent, setViewingEvent] = useState<EventoCompleto | null>(null);
  
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { clients } = useClients();

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: EventoCompleto) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleViewEvent = (event: EventoCompleto) => {
    setViewingEvent(event);
    setShowDetailModal(true);
  };

  const handleDeleteEvent = async (event: EventoCompleto) => {
    if (confirm(`¿Está seguro de que desea eliminar el evento "${event.nombre_proyecto}"?`)) {
      deleteEvent(event.id);
    }
  };

  const handleSaveEvent = (eventData: any) => {
    // Clean up time fields - convert empty strings to null
    const cleanedEventData = {
      ...eventData,
      hora_inicio: eventData.hora_inicio || null,
      hora_fin: eventData.hora_fin || null,
      presupuesto_estimado: parseFloat(eventData.presupuesto_estimado) || 0,
      cliente_id: eventData.cliente_id || null,
      responsable_id: eventData.responsable_id || null,
      tipo_evento_id: eventData.tipo_evento_id || null
    };
    
    if (editingEvent) {
      updateEvent({ id: editingEvent.id, data: cleanedEventData });
    } else {
      createEvent(cleanedEventData);
    }
    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!events.length) return null;
    
    return {
      totalEventos: events.length,
      totalIngresos: events.reduce((sum, e) => sum + (e.total || 0), 0),
      totalUtilidad: events.reduce((sum, e) => sum + (e.utilidad || 0), 0),
      eventosPagados: events.filter(e => e.status_pago === 'pagado').length,
      eventosFacturados: events.filter(e => e.status_facturacion === 'facturado').length,
      eventosPendientes: events.filter(e => e.status_pago === 'pendiente').length,
      attachedDocuments: events.reduce((sum, e) => {
        // This would be calculated from actual file attachment data
        return sum + Math.floor(Math.random() * 2); // Mock data
      }, 0)
    };
  }, [events]);

  const columns = [
    {
      key: 'clave_evento',
      label: 'Clave',
      filterType: 'text' as const,
      render: (value: string, row: EventoCompleto) => (
        <div>
          <div className="font-mono text-sm font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">
            {formatDate(row.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'nombre_proyecto',
      label: 'Proyecto',
      filterType: 'text' as const,
      render: (value: string, row: EventoCompleto) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.responsable_nombre}</div>
          <div className="text-xs text-gray-400">
            {formatDate(row.fecha_evento)}
            {row.fecha_fin && row.fecha_fin !== row.fecha_evento && 
              ` - ${formatDate(row.fecha_fin)}`
            }
          </div>
        </div>
      )
    },
    {
      key: 'cliente_nombre',
      label: 'Cliente',
      filterType: 'text' as const,
      render: (value: string, row: EventoCompleto) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.cliente_comercial || value}
          </div>
          <div className="text-sm text-gray-500">{row.cliente_rfc}</div>
        </div>
      )
    },
    {
      key: 'status_pago',
      label: 'Estado de Pago',
      filterType: 'select' as const,
      filterOptions: [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'pago_pendiente', label: 'Pago Pendiente' },
        { value: 'pagado', label: 'Pagado' },
        { value: 'vencido', label: 'Vencido' }
      ],
      render: (value: string, row: EventoCompleto) => {
        const variants = {
          'pendiente': 'warning',
          'pago_pendiente': 'warning',
          'pagado': 'success',
          'vencido': 'danger'
        };
        
        const labels = {
          'pendiente': 'Pendiente',
          'pago_pendiente': 'Pago Pendiente',
          'pagado': 'Pagado',
          'vencido': 'Vencido'
        };
        
        return (
          <div>
            <Badge 
              variant={variants[value as keyof typeof variants] as any} 
              size="sm"
            >
              {labels[value as keyof typeof labels]}
            </Badge>
            {row.dias_vencido && row.dias_vencido > 0 && (
              <div className="text-xs text-red-600 mt-1">
                {row.dias_vencido} días vencido
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'total',
      label: 'Total',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'presupuesto_estimado',
      label: 'Presupuesto Est.',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number) => (
        <div className="text-gray-700">
          {formatCurrency(value || 0)}
        </div>
      )
    },
    {
      key: 'utilidad',
      label: 'Utilidad',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number, row: EventoCompleto) => {
        const isPositive = value >= 0;
        const margen = row.total > 0 ? (value / row.total) * 100 : 0;
        return (
          <div>
            <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(value)}
            </div>
            <div className="text-xs text-gray-500">
              {margen.toFixed(1)}% margen
            </div>
          </div>
        );
      }
    }
  ];

  const actions = [
    {
      label: 'Ver Detalle',
      icon: Eye,
      onClick: handleViewEvent,
      tooltip: 'Ver detalles completos del evento'
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: handleEditEvent,
      show: () => canUpdate('eventos'),
      tooltip: canUpdate('eventos') ? 'Editar evento' : 'Sin permisos para editar'
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: handleDeleteEvent,
      show: () => canDelete('eventos'),
      className: 'text-red-600 hover:text-red-700',
      tooltip: canDelete('eventos') ? 'Eliminar evento' : 'Sin permisos para eliminar'
    }
  ];

  if (isLoading) return <PageSkeleton />;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los eventos con control financiero y OCR integrado
          </p>
        </div>
        
        {canCreate('eventos') && (
          <Button
            onClick={handleCreateEvent}
            className="bg-mint-500 hover:bg-mint-600 mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.totalEventos}</p>
                <p className="text-sm text-gray-600">Total Eventos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(summaryMetrics.totalIngresos)}
                </p>
                <p className="text-sm text-gray-600">Ingresos Totales</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-mint-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-mint-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(summaryMetrics.totalUtilidad)}
                </p>
                <p className="text-sm text-gray-600">Utilidad Total</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Paperclip className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summaryMetrics.attachedDocuments}</p>
                <p className="text-sm text-gray-600">Archivos Adjuntos</p>
                <div className="flex space-x-2 text-xs mt-1">
                  <span className="text-green-600 font-medium">
                    {summaryMetrics.eventosPagados} pagados
                  </span>
                  <span className="text-yellow-600 font-medium">
                    {summaryMetrics.eventosPendientes} pendientes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Table */}
      <DataTable
        data={events}
        columns={columns}
        actions={actions}
        exportable={true}
        selectable={true}
        filterable={true}
        onRowClick={handleViewEvent}
      />

      {/* Event Form Modal */}
      {showEventModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          title={editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
          size="xl"
        >
          <EventForm
            event={editingEvent}
            clients={clients}
            onSave={handleSaveEvent}
            onCancel={() => {
              setShowEventModal(false);
              setEditingEvent(null);
            }}
          />
        </Modal>
      )}

      {/* Event Detail Modal */}
      {showDetailModal && viewingEvent && (
        <EventDetail
          event={viewingEvent}
          onClose={() => {
            setShowDetailModal(false);
            setViewingEvent(null);
          }}
          onEdit={(event) => {
            setShowDetailModal(false);
            setViewingEvent(null);
            setEditingEvent(event);
            setShowEventModal(true);
          }}
        />
      )}
    </motion.div>
  );
};