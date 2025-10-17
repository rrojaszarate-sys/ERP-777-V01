import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, Calendar, DollarSign, TrendingUp, Users, FileText, Eye, CreditCard as Edit, Trash2, RotateCcw, Settings, BarChart3 } from 'lucide-react';
import { supabase } from '../../core/config/supabase';
import { usePermissions } from '../../core/permissions/usePermissions';
import { useAuth } from '../../core/auth/AuthProvider';
import { DataTable } from '../../shared/components/tables/DataTable';
import { Button } from '../../shared/components/ui/Button';
import { Badge } from '../../shared/components/ui/Badge';
import { Modal } from '../../shared/components/ui/Modal';
import { formatCurrency, formatDate, getMonthName } from '../../shared/utils/formatters';
import { PageSkeleton } from '../../shared/components/ui/LoadingSpinner';
import { EventoCompleto, CATEGORIAS_GASTO, STATUS_WORKFLOW } from '../../core/types/events';
import { exportService } from '../../services/exportService';
import { auditService } from '../../services/auditService';
import { WorkflowStatusManager } from './components/WorkflowStatusManager';
import { v4 as uuidv4 } from 'uuid';

export const EventosAdvancedPage: React.FC = () => {
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: null as number | null,
    status: [] as string[],
    cliente: '',
    responsable: '',
    fechaInicio: '',
    fechaFin: ''
  });
  
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoCompleto | null>(null);
  const [viewingEvento, setViewingEvento] = useState<EventoCompleto | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete, hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  // Fetch events with advanced filtering
  const { data: eventos, isLoading, refetch } = useQuery({
    queryKey: ['eventos-advanced', filters],
    queryFn: async () => {
      try {
        return await eventsService.getEvents(filters);
      } catch (error) {
        console.warn('⚠️ Error fetching events from Supabase:', error);
        return [];
      }
    },
    retry: false
  });

  // Calculate summary metrics
  const metricas = useMemo(() => {
    if (!eventos) return null;

    const totalEventos = eventos.length;
    const totalIngresos = eventos.reduce((sum, e) => sum + e.total, 0);
    const totalGastos = eventos.reduce((sum, e) => sum + (e.total - e.utilidad), 0);
    const totalUtilidad = eventos.reduce((sum, e) => sum + e.utilidad, 0);
    
    const eventosPorStatus = eventos.reduce((acc, evento) => {
      acc[evento.status_workflow] = (acc[evento.status_workflow] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEventos,
      totalIngresos,
      totalGastos,
      totalUtilidad,
      margenPromedio: totalIngresos > 0 ? (totalUtilidad / totalIngresos) * 100 : 0,
      eventosPorStatus
    };
  }, [eventos]);

  // Mutations for CRUD operations
  const createEventoMutation = useMutation({
    mutationFn: async (eventoData: Partial<EventoCompleto>) => {
      const newEvento = {
        ...eventoData,
        id: uuidv4(),
        clave_unica: `EVT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Log the creation
      await auditService.logAction(
        newEvento.id,
        user?.id || '',
        auditService.ACTIONS.EVENT_CREATED,
        null,
        newEvento
      );

      return newEvento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-advanced'] });
    }
  });

  const updateEventoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventoCompleto> }) => {
      const originalEvento = eventos?.find(e => e.id === id);
      
      // Log the update
      await auditService.logAction(
        id,
        user?.id || '',
        auditService.ACTIONS.EVENT_UPDATED,
        originalEvento,
        data
      );

      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-advanced'] });
    }
  });

  const deleteEventoMutation = useMutation({
    mutationFn: async (id: string) => {
      const eventoToDelete = eventos?.find(e => e.id === id);
      
      // Log the deletion
      await auditService.logAction(
        id,
        user?.id || '',
        auditService.ACTIONS.EVENT_DELETED,
        eventoToDelete,
        null
      );

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventos-advanced'] });
    }
  });

  // Event handlers
  const handleCreateEvento = () => {
    setEditingEvento(null);
    setShowEventModal(true);
  };

  const handleEditEvento = (evento: EventoCompleto) => {
    setEditingEvento(evento);
    setShowEventModal(true);
  };

  const handleViewEvento = (evento: EventoCompleto) => {
    setViewingEvento(evento);
    setShowDetailModal(true);
  };

  const handleDeleteEvento = async (evento: EventoCompleto) => {
    if (confirm(`¿Está seguro de que desea eliminar el evento "${evento.nombre}"?`)) {
      deleteEventoMutation.mutate(evento.id);
    }
  };

  const handleStatusChange = (eventoId: string, newStatus: string, validationData?: any) => {
    updateEventoMutation.mutate({
      id: eventoId,
      data: { 
        status_workflow: newStatus as any,
        updated_at: new Date().toISOString()
      }
    });
  };

  const handleExportPDF = async () => {
    if (eventos) {
      await exportService.exportEventsToPDF(eventos, filters);
      
      // Log export action
      await auditService.logAction(
        'system',
        user?.id || '',
        auditService.ACTIONS.EXPORT_PDF,
        null,
        { filtros: filters, total_eventos: eventos.length }
      );
    }
  };

  const handleExportExcel = async () => {
    if (eventos) {
      await exportService.exportEventsToExcel(eventos, true);
      
      // Log export action
      await auditService.logAction(
        'system',
        user?.id || '',
        auditService.ACTIONS.EXPORT_EXCEL,
        null,
        { filtros: filters, total_eventos: eventos.length }
      );
    }
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      month: null,
      status: [],
      cliente: '',
      responsable: '',
      fechaInicio: '',
      fechaFin: ''
    });
  };

  // Table columns configuration
  const columns = [
    {
      key: 'clave_unica',
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
      key: 'nombre',
      label: 'Evento',
      filterType: 'text' as const,
      render: (value: string, row: EventoCompleto) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.responsable?.nombre}
          </div>
          <div className="text-xs text-gray-400">
            {formatDate(row.fecha_inicio)} - {formatDate(row.fecha_fin)}
          </div>
        </div>
      )
    },
    {
      key: 'cliente',
      label: 'Cliente',
      filterType: 'text' as const,
      render: (value: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {value?.nombre_comercial || value?.razon_social}
          </div>
          <div className="text-sm text-gray-500">{value?.rfc}</div>
        </div>
      )
    },
    {
      key: 'status_workflow',
      label: 'Estado',
      filterType: 'select' as const,
      filterOptions: Object.entries(STATUS_WORKFLOW).map(([key, label]) => ({
        value: key,
        label
      })),
      render: (value: string) => {
        const variants = {
          'pendiente_facturar': 'warning',
          'facturado': 'info',
          'pago_pendiente': 'warning',
          'pagado': 'success'
        };
        
        return (
          <Badge 
            variant={variants[value as keyof typeof variants] as any} 
            size="sm"
          >
            {STATUS_WORKFLOW[value as keyof typeof STATUS_WORKFLOW]}
          </Badge>
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

  // Table actions
  const actions = [
    {
      label: 'Ver Detalle',
      icon: Eye,
      onClick: handleViewEvento,
      tooltip: 'Ver detalles completos del evento'
    },
    {
      label: 'Editar',
      icon: Edit,
      onClick: handleEditEvento,
      show: () => canUpdate('eventos'),
      tooltip: canUpdate('eventos') ? 'Editar evento' : 'Sin permisos para editar'
    },
    {
      label: 'Eliminar',
      icon: Trash2,
      onClick: handleDeleteEvento,
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema Avanzado de Eventos</h1>
          <p className="text-gray-600">
            Gestión integral con control financiero, OCR y workflows automatizados
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {canCreate('eventos') && (
            <Button
              onClick={handleCreateEvento}
              className="bg-mint-500 hover:bg-mint-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Evento
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros Avanzados
          </h3>
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={filters.year || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                year: parseInt(e.target.value) || new Date().getFullYear(),
                month: null 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
            >
              {[2024, 2023, 2022].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={filters.month || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                month: e.target.value ? parseInt(e.target.value) : null 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
            >
              <option value="">Todo el año</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              multiple
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                status: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
            >
              {Object.entries(STATUS_WORKFLOW).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              value={filters.cliente}
              onChange={(e) => setFilters(prev => ({ ...prev, cliente: e.target.value }))}
              placeholder="Buscar cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
            <input
              type="text"
              value={filters.responsable}
              onChange={(e) => setFilters(prev => ({ ...prev, responsable: e.target.value }))}
              placeholder="Buscar responsable..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
            />
          </div>

          <div className="flex items-end">
            <div className="flex space-x-2">
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                disabled={!eventos || eventos.length === 0}
              >
                <FileText className="w-4 h-4 mr-1" />
                PDF
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="outline"
                size="sm"
                disabled={!eventos || eventos.length === 0}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Eventos"
            value={metricas.totalEventos.toString()}
            icon={Calendar}
            color="blue"
            subtitle="En el período"
          />
          <MetricCard
            title="Ingresos Totales"
            value={formatCurrency(metricas.totalIngresos)}
            icon={DollarSign}
            color="green"
            subtitle="Facturación total"
          />
          <MetricCard
            title="Gastos Totales"
            value={formatCurrency(metricas.totalGastos)}
            icon={TrendingUp}
            color="red"
            subtitle="Costos operativos"
          />
          <MetricCard
            title="Utilidad Neta"
            value={formatCurrency(metricas.totalUtilidad)}
            icon={TrendingUp}
            color="mint"
            subtitle={`${metricas.margenPromedio.toFixed(1)}% margen`}
          />
          <MetricCard
            title="Estados"
            value={`${metricas.eventosPorStatus.pagado || 0} pagados`}
            icon={Users}
            color="purple"
            subtitle={`${metricas.eventosPorStatus.pago_pendiente || 0} pendientes`}
          />
        </div>
      )}

      {/* Events Table */}
      <DataTable
        data={eventos || []}
        columns={columns}
        actions={actions}
        exportable={true}
        selectable={true}
        filterable={true}
        onRowClick={handleViewEvento}
        className="shadow-sm"
      />

      {/* Modals */}
      {showEventModal && (
        <EventoAdvancedModal
          evento={editingEvento}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvento(null);
          }}
          onSave={(eventoData) => {
            if (editingEvento) {
              updateEventoMutation.mutate({ id: editingEvento.id, data: eventoData });
            } else {
              createEventoMutation.mutate(eventoData);
            }
            setShowEventModal(false);
            setEditingEvento(null);
          }}
        />
      )}

      {showDetailModal && viewingEvento && (
        <EventoDetailAdvancedModal
          evento={viewingEvento}
          onClose={() => {
            setShowDetailModal(false);
            setViewingEvento(null);
          }}
          onEdit={(evento) => {
            setShowDetailModal(false);
            setViewingEvento(null);
            setEditingEvento(evento);
            setShowEventModal(true);
          }}
          onStatusChange={handleStatusChange}
          onRefresh={refetch}
        />
      )}
    </motion.div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    mint: 'bg-mint-100 text-mint-800',
    purple: 'bg-purple-100 text-purple-800'
  };

  return (
    <motion.div
      className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Advanced Event Modal (placeholder - would need full implementation)
const EventoAdvancedModal: React.FC<{
  evento: EventoCompleto | null;
  onClose: () => void;
  onSave: (data: Partial<EventoCompleto>) => void;
}> = ({ evento, onClose, onSave }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={evento ? 'Editar Evento' : 'Nuevo Evento'}
      size="xl"
    >
      <div className="p-6">
        <p className="text-gray-600">
          Modal de evento avanzado con todos los campos y validaciones...
        </p>
        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={() => onSave({})} className="bg-mint-500 hover:bg-mint-600">
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Advanced Detail Modal (placeholder)
const EventoDetailAdvancedModal: React.FC<{
  evento: EventoCompleto;
  onClose: () => void;
  onEdit: (evento: EventoCompleto) => void;
  onStatusChange: (eventoId: string, status: string, data?: any) => void;
  onRefresh: () => void;
}> = ({ evento, onClose, onEdit, onStatusChange, onRefresh }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Detalle: ${evento.nombre}`}
      size="full"
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium mb-4">Información del Evento</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Clave Única</dt>
                  <dd className="text-sm text-gray-900 font-mono">{evento.clave_unica}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                  <dd className="text-sm text-gray-900">{evento.cliente?.razon_social}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Responsable</dt>
                  <dd className="text-sm text-gray-900">{evento.responsable?.nombre}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fechas</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(evento.fecha_inicio)} - {formatDate(evento.fecha_fin)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          <div>
            <WorkflowStatusManager
              evento={evento}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button onClick={() => onEdit(evento)} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};