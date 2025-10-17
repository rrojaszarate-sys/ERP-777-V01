import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  FileText, DollarSign, Clock, Target, RotateCcw,
  TrendingUp, AlertTriangle, Calendar, Filter 
} from 'lucide-react';
import { supabase } from '../../core/config/supabase';
import { DataTable } from '../../shared/components/tables/DataTable';
import { Button } from '../../shared/components/ui/Button';
import { Badge } from '../../shared/components/ui/Badge';
import { formatCurrency, formatDate, getMonthName } from '../../shared/utils/formatters';
import { PageSkeleton } from '../../shared/components/ui/LoadingSpinner';
import { Chart3DContainer } from '../dashboard/components/Chart3DContainer';

export const MasterFacturacionPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState({
    year: currentYear,
    month: null as number | null,
    estado: [] as string[],
    cliente: null as string | null,
    responsable: null as string | null
  });

  // Obtener años disponibles dinámicamente
  const { data: availableYears } = useQuery({
    queryKey: ['available-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evt_eventos')
        .select('fecha_evento')
        .not('fecha_evento', 'is', null);
      
      if (error) throw error;
      
      const years = [...new Set(data?.map(e => 
        new Date(e.fecha_evento).getFullYear()
      ))].sort((a, b) => b - a);
      
      return years;
    }
  });

  // Obtener meses disponibles para el año seleccionado
  const { data: availableMonths } = useQuery({
    queryKey: ['available-months', filters.year],
    queryFn: async () => {
      if (!filters.year) return [];
      
      const { data, error } = await supabase
        .from('evt_eventos')
        .select('fecha_evento')
        .gte('fecha_evento', `${filters.year}-01-01`)
        .lt('fecha_evento', `${filters.year + 1}-01-01`);
      
      if (error) throw error;
      
      const months = [...new Set(data?.map(e => 
        new Date(e.fecha_evento).getMonth() + 1
      ))].sort((a, b) => a - b);
      
      return months;
    },
    enabled: !!filters.year
  });

  // Datos filtrados del master de facturación
  const { data: eventos, isLoading } = useQuery({
    queryKey: ['master-facturacion', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_master_facturacion')
        .select('*');
      
      if (error) throw error;
      
      // Aplicar filtros en el cliente
      let filteredData = data || [];
      
      if (filters.year) {
        filteredData = filteredData.filter(item => item.año === filters.year);
      }
      
      if (filters.month) {
        filteredData = filteredData.filter(item => item.mes === filters.month);
      }
      
      if (filters.estado.length > 0) {
        filteredData = filteredData.filter(item => 
          filters.estado.includes(item.status_pago)
        );
      }
      
      if (filters.cliente) {
        filteredData = filteredData.filter(item => 
          item.cliente_nombre.toLowerCase().includes(filters.cliente!.toLowerCase())
        );
      }
      
      if (filters.responsable) {
        filteredData = filteredData.filter(item => 
          item.responsable?.toLowerCase().includes(filters.responsable!.toLowerCase())
        );
      }
      
      return filteredData.sort((a, b) => 
        new Date(b.fecha_evento).getTime() - new Date(a.fecha_evento).getTime()
      );
    }
  });

  // Métricas consolidadas del período
  const metricas = useMemo(() => {
    if (!eventos) return null;
    
    return {
      totalEventos: eventos.length,
      totalFacturado: eventos.reduce((sum, e) => sum + (e.total || 0), 0),
      totalCobrado: eventos.filter(e => e.status_pago === 'pagado').reduce((sum, e) => sum + (e.total || 0), 0),
      porCobrar: eventos.filter(e => e.status_pago !== 'pagado').reduce((sum, e) => sum + (e.total || 0), 0),
      utilidadPeriodo: eventos.reduce((sum, e) => sum + (e.utilidad || 0), 0),
      eventosVencidos: eventos.filter(e => e.dias_vencido > 0).length,
      tasaCobranza: eventos.length > 0 ? 
        (eventos.filter(e => e.status_pago === 'pagado').length / eventos.length) * 100 : 0
    };
  }, [eventos]);

  const clearFilters = () => {
    setFilters({
      year: currentYear,
      month: null,
      estado: [],
      cliente: null,
      responsable: null
    });
  };

  const columns = [
    {
      key: 'evento_nombre',
      label: 'Evento',
      filterType: 'text' as const,
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {formatDate(row.fecha_evento)}
          </div>
        </div>
      )
    },
    {
      key: 'cliente_nombre',
      label: 'Cliente',
      filterType: 'text' as const,
      render: (value: string) => (
        <div className="text-gray-900">{value}</div>
      )
    },
    {
      key: 'responsable',
      label: 'Responsable',
      filterType: 'text' as const,
      render: (value: string) => (
        <div className="text-gray-900">{value}</div>
      )
    },
    {
      key: 'status_pago',
      label: 'Estado',
      filterType: 'select' as const,
      filterOptions: [
        { value: 'pendiente_facturar', label: 'Pendiente Facturar' },
        { value: 'facturado', label: 'Facturado' },
        { value: 'pago_pendiente', label: 'Pago Pendiente' },
        { value: 'pagado', label: 'Pagado' }
      ],
      render: (value: string, row: any) => {
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
          <div>
            <Badge 
              variant={variants[value as keyof typeof variants] as any} 
              size="sm"
            >
              {labels[value as keyof typeof labels]}
            </Badge>
            {row.dias_vencido > 0 && (
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
          {formatCurrency(value || 0)}
        </div>
      )
    },
    {
      key: 'utilidad',
      label: 'Utilidad',
      filterType: 'number' as const,
      align: 'right' as const,
      render: (value: number) => {
        const isPositive = (value || 0) >= 0;
        return (
          <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(value || 0)}
          </div>
        );
      }
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
      {/* Header con filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master de Facturación</h1>
          <p className="text-gray-600">Control centralizado de facturación y cobranza</p>
        </div>
        
        {/* Filtros dinámicos */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtros:</span>
          </div>
          
          <select
            value={filters.year || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              year: parseInt(e.target.value),
              month: null // Reset mes al cambiar año
            }))}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
          >
            <option value="">Todos los años</option>
            {availableYears?.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={filters.month || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              month: e.target.value ? parseInt(e.target.value) : null 
            }))}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-mint-500 text-sm"
            disabled={!filters.year}
          >
            <option value="">Todo el año</option>
            {availableMonths?.map(month => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Métricas consolidadas */}
      {metricas && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPIs del período */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-4">
            <MetricCard
              title="Total Facturado"
              value={formatCurrency(metricas.totalFacturado)}
              icon={FileText}
              color="blue"
            />
            <MetricCard
              title="Total Cobrado"
              value={formatCurrency(metricas.totalCobrado)}
              icon={DollarSign}
              color="green"
            />
            <MetricCard
              title="Por Cobrar"
              value={formatCurrency(metricas.porCobrar)}
              icon={Clock}
              color="orange"
            />
            <MetricCard
              title="Tasa Cobranza"
              value={`${metricas.tasaCobranza.toFixed(1)}%`}
              icon={Target}
              color={metricas.tasaCobranza > 80 ? "green" : "red"}
            />
          </div>

          {/* Gráfico consolidado */}
          <div className="lg:col-span-2">
            <Chart3DContainer title="Análisis del Período" className="h-80">
              <ConsolidatedChart3D 
                data={{
                  facturado: metricas.totalFacturado,
                  cobrado: metricas.totalCobrado,
                  porCobrar: metricas.porCobrar,
                  utilidad: metricas.utilidadPeriodo
                }}
                period={filters.month ? 
                  `${getMonthName(filters.month)} ${filters.year}` : 
                  `Año ${filters.year}`
                }
              />
            </Chart3DContainer>
          </div>
        </div>
      )}

      {/* Alertas importantes */}
      {metricas && metricas.eventosVencidos > 0 && (
        <motion.div
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">
                Atención: {metricas.eventosVencidos} evento(s) con pagos vencidos
              </h3>
              <p className="text-red-700 text-sm">
                Revisa los eventos marcados como vencidos para realizar el seguimiento de cobranza.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* DataTable de eventos */}
      <DataTable
        data={eventos || []}
        columns={columns}
        exportable={true}
        selectable={false}
        filterable={true}
      />
    </motion.div>
  );
};

// Componente de métrica
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );
};

// Gráfico consolidado 3D
const ConsolidatedChart3D: React.FC<{
  data: {
    facturado: number;
    cobrado: number;
    porCobrar: number;
    utilidad: number;
  };
  period: string;
}> = ({ data, period }) => {
  const maxValue = Math.max(data.facturado, data.cobrado, data.porCobrar);
  const facturadoHeight = (data.facturado / maxValue) * 180;
  const cobradoHeight = (data.cobrado / maxValue) * 180;
  const porCobrarHeight = (data.porCobrar / maxValue) * 180;
  
  return (
    <div className="relative h-full flex items-center justify-center">
      <svg viewBox="0 0 500 300" className="w-full h-full">
        <defs>
          <linearGradient id="facturadoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="cobradoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="porCobrarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="1" />
          </linearGradient>
          <filter id="barShadow">
            <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Título del período */}
        <text x={250} y={30} textAnchor="middle" className="text-lg font-medium fill-gray-700">
          {period}
        </text>
        
        {/* Barras 3D */}
        <g>
          {/* Facturado */}
          <rect
            x={100}
            y={260 - facturadoHeight}
            width={50}
            height={facturadoHeight}
            fill="url(#facturadoGradient)"
            filter="url(#barShadow)"
          />
          <polygon
            points={`100,${260 - facturadoHeight} 150,${260 - facturadoHeight} 165,${245 - facturadoHeight} 115,${245 - facturadoHeight}`}
            fill="#1E40AF"
          />
          <polygon
            points={`150,${260 - facturadoHeight} 150,260 165,245 165,${245 - facturadoHeight}`}
            fill="#1E3A8A"
          />
          
          {/* Cobrado */}
          <rect
            x={200}
            y={260 - cobradoHeight}
            width={50}
            height={cobradoHeight}
            fill="url(#cobradoGradient)"
            filter="url(#barShadow)"
          />
          <polygon
            points={`200,${260 - cobradoHeight} 250,${260 - cobradoHeight} 265,${245 - cobradoHeight} 215,${245 - cobradoHeight}`}
            fill="#047857"
          />
          <polygon
            points={`250,${260 - cobradoHeight} 250,260 265,245 265,${245 - cobradoHeight}`}
            fill="#065F46"
          />
          
          {/* Por Cobrar */}
          <rect
            x={300}
            y={260 - porCobrarHeight}
            width={50}
            height={porCobrarHeight}
            fill="url(#porCobrarGradient)"
            filter="url(#barShadow)"
          />
          <polygon
            points={`300,${260 - porCobrarHeight} 350,${260 - porCobrarHeight} 365,${245 - porCobrarHeight} 315,${245 - porCobrarHeight}`}
            fill="#B45309"
          />
          <polygon
            points={`350,${260 - porCobrarHeight} 350,260 365,245 365,${245 - porCobrarHeight}`}
            fill="#92400E"
          />
        </g>
        
        {/* Etiquetas */}
        <text x={125} y={280} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
          Facturado
        </text>
        <text x={125} y={295} textAnchor="middle" className="text-xs fill-gray-500">
          {formatCurrency(data.facturado)}
        </text>
        
        <text x={225} y={280} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
          Cobrado
        </text>
        <text x={225} y={295} textAnchor="middle" className="text-xs fill-gray-500">
          {formatCurrency(data.cobrado)}
        </text>
        
        <text x={325} y={280} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
          Por Cobrar
        </text>
        <text x={325} y={295} textAnchor="middle" className="text-xs fill-gray-500">
          {formatCurrency(data.porCobrar)}
        </text>
      </svg>
    </div>
  );
};