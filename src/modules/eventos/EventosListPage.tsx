import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, CreditCard as Edit, Eye, Trash2, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../../core/config/supabase';
import { usePermissions } from '../../core/permissions/usePermissions';
import { DataTable } from '../../shared/components/tables/DataTable';
import { Button } from '../../shared/components/ui/Button';
import { Badge } from '../../shared/components/ui/Badge';
import { formatCurrency, formatDate } from '../../shared/utils/formatters';
import { PageSkeleton } from '../../shared/components/ui/LoadingSpinner';
import { EventoModal } from './components/EventoModal';
import { EventoDetailModal } from './components/EventoDetailModal';

export const EventosListPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [viewingEvento, setViewingEvento] = useState(null);
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const { data: eventos, isLoading, refetch } = useQuery({
    queryKey: ['eventos-list'],
    queryFn: async () => {
      // Return mock data when Supabase is not available
      return [
        {
          id: '1',
          nombre: 'Conferencia Tech 2024',
          descripcion: 'Conferencia anual de tecnología',
          fecha_evento: '2024-02-15',
          status_evento: 'confirmado',
          status_pago: 'pagado',
          cliente: { razon_social: 'Tech Corp SA', nombre_comercial: 'TechCorp' },
          responsable: { nombre: 'Juan Pérez' },
          ingresos: [{ total: 25000 }],
          gastos: [{ total: 15000 }]
        },
        {
          id: '2',
          nombre: 'Evento Corporativo',
          descripcion: 'Evento de fin de año',
          fecha_evento: '2024-02-20',
          status_evento: 'planificacion',
          status_pago: 'facturado',
          cliente: { razon_social: 'Empresa XYZ', nombre_comercial: 'XYZ Corp' },
          responsable: { nombre: 'María García' },
          ingresos: [{ total: 18000 }],
          gastos: [{ total: 12000 }]
        }
      ];
    },
    retry: false
  });

  const { data: resumenEventos } = useQuery({
    queryKey: ['resumen-eventos'],
    queryFn: async () => {
      // Return mock summary data
      return {
        total: 43000,
        utilidad: 16000,
        count: 2,
        pagados: 1,
        facturados: 1,
        pendientes: 0
      };
    },
    retry: false
  });

  const handleEditEvento = (evento: any) => {
    setEditingEvento(evento);
    setShowModal(true);
  };

  const handleViewEvento = (evento: any) => {
    setViewingEvento(evento);
    setShowDetailModal(true);
  };

  const handleDeleteEvento = async (evento: any) => {
    if (confirm(`¿Está seguro de que desea eliminar el evento "${evento.nombre}"?`)) {
      try {
        const { error } = await supabase
          .from('evt_eventos')
          .delete()
          .eq('id', evento.id);
        
        if (error) throw error;
        refetch();
      } catch (error) {
        console.error('Error al eliminar evento:', error);
      }
    }
  };

  const columns = [
    {
      key: 'nombre',
      label: 'Evento',
      filterType: 'text' as const,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {row.responsable?.nombre}
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
            {value?.razon_social || value?.nombre_comercial}
          </div>
        </div>
      )
    },
    {
      key: 'status_pago',
      label: 'Estado de Pago',
      filterType: 'select' as const,
      filterOptions: [
        { value: 'pendiente_facturar', label: 'Pendiente Facturar' },
        { value: 'facturado', label: 'Facturado' },
        { value: 'pago_pendiente', label: 'Pago Pendiente' },
        { value: 'pagado', label: 'Pagado' }
      ],
      render: (value: string) => {
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
          <Badge 
            variant={variants[value as keyof typeof variants] as any} 
            size="sm"
          >
            {labels[value as keyof typeof labels]}
          </Badge>
        );
      }
    },
    {
      key: 'total_ingresos',
      label: 'Ingresos',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(value || 0)}
        </div>
      )
    },
    {
      key: 'presupuesto_estimado',
      label: 'Presupuesto',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number, row: any) => (
        <div className="text-gray-700">
          <div>{formatCurrency(value || 0)}</div>
          {value && row.ingresos && (
            <div className={`text-xs ${
              (row.ingresos.reduce((sum: number, ing: any) => sum + (ing.total || 0), 0) || 0) <= value
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {(row.ingresos.reduce((sum: number, ing: any) => sum + (ing.total || 0), 0) || 0) <= value 
                ? 'Dentro' 
                : 'Excede'
              }
            </div>
          )}
        </div>
      )
    },
    {
      key: 'utilidad',
      label: 'Utilidad',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number, row: any) => {
        const totalIngresos = row.ingresos?.reduce((sum: number, ing: any) => sum + (ing.total || 0), 0) || 0;
        const totalGastos = row.gastos?.reduce((sum: number, gasto: any) => sum + (gasto.total || 0), 0) || 0;
        const utilidad = totalIngresos - totalGastos;
        const isPositive = utilidad >= 0;
        return (
          <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(utilidad)}
          </div>
        );
      }
    }
  ];

  const actions = [
    {
      label: 'Ver Detalle',
      icon: Eye,
      onClick: handleViewEvento,
      tooltip: 'Ver detalles del evento'
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Eventos</h1>
          <p className="text-gray-600 mt-1">
            Administra todos los eventos de la empresa
          </p>
        </div>
        
        {canCreate('eventos') && (
          <Button
            onClick={() => {
              setEditingEvento(null);
              setShowModal(true);
            }}
            className="bg-mint-500 hover:bg-mint-600 mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        )}
      </div>

      {/* Resumen ejecutivo */}
      {resumenEventos && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resumenEventos.count}</p>
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
                  {formatCurrency(resumenEventos.total)}
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
                  {formatCurrency(resumenEventos.utilidad)}
                </p>
                <p className="text-sm text-gray-600">Utilidad Total</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="flex space-x-2 text-sm">
                  <span className="text-green-600 font-medium">
                    {resumenEventos.pagados} pagados
                  </span>
                  <span className="text-yellow-600 font-medium">
                    {resumenEventos.pendientes} pendientes
                  </span>
                </div>
                <p className="text-sm text-gray-600">Estados de Pago</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de eventos */}
      <DataTable
        data={eventos || []}
        columns={columns}
        actions={actions}
        exportable={true}
        selectable={true}
        filterable={true}
        onRowClick={handleViewEvento}
      />

      {/* Modal de evento */}
      {showModal && (
        <EventoModal
          evento={editingEvento}
          onClose={() => {
            setShowModal(false);
            setEditingEvento(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingEvento(null);
            refetch();
          }}
        />
      )}

      {/* Modal de detalle */}
      {showDetailModal && viewingEvento && (
        <EventoDetailModal
          evento={viewingEvento}
          onClose={() => {
            setShowDetailModal(false);
            setViewingEvento(null);
          }}
          onEdit={(evento) => {
            setShowDetailModal(false);
            setViewingEvento(null);
            setEditingEvento(evento);
            setShowModal(true);
          }}
          onRefresh={refetch}
        />
      )}
    </motion.div>
  );
};