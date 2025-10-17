import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './core/auth/AuthProvider';
import { Layout } from './shared/components/layout/Layout';
import { LoadingSpinner } from './shared/components/ui/LoadingSpinner';

// Lazy loading de páginas para code splitting
const EventsDashboard = lazy(() => import('./modules/eventos/pages/EventsDashboard').then(m => ({ default: m.EventsDashboard })));
const EventsListPage = lazy(() => import('./modules/eventos/pages/EventsListPage').then(m => ({ default: m.EventsListPage })));
const EventosAdvancedPage = lazy(() => import('./modules/eventos/EventosAdvancedPage').then(m => ({ default: m.EventosAdvancedPage })));
const ClientesPage = lazy(() => import('./modules/eventos/ClientesListPage').then(m => ({ default: m.ClientesPage })));
const MasterFacturacionPage = lazy(() => import('./modules/eventos/MasterFacturacionPage').then(m => ({ default: m.MasterFacturacionPage })));
// const FacturasPage = lazy(() => import('./modules/eventos/pages/FacturasPage').then(m => ({ default: m.FacturasPage }))); // ❌ Archivo movido a trash
const DatabaseAdminPage = lazy(() => import('./modules/admin/DatabaseAdminPage').then(m => ({ default: m.DatabaseAdminPage })));
const AccountingStateDashboard = lazy(() => import('./modules/eventos/components/accounting/AccountingStateDashboard').then(m => ({ default: m.AccountingStateDashboard })));
const WorkflowVisualizationPage = lazy(() => import('./modules/eventos/components/workflow/WorkflowVisualizationPage').then(m => ({ default: m.WorkflowVisualizationPage })));
const OcrTestPage = lazy(() => import('./modules/ocr/pages/OcrTestPage').then(m => ({ default: m.default })));
const OCRDebugPage = lazy(() => import('./modules/ocr/pages/OCRDebugPage').then(m => ({ default: m.default })));
const SimpleOCRDebugPage = lazy(() => import('./modules/ocr/pages/SimpleOCRDebugPage').then(m => ({ default: m.default })));
const SuperSimpleOCR = lazy(() => import('./modules/ocr/pages/SuperSimpleOCR').then(m => ({ default: m.default })));
const RealOCR = lazy(() => import('./modules/ocr/pages/RealOCR').then(m => ({ default: m.default })));
const GoogleVisionOCR = lazy(() => import('./modules/ocr/pages/GoogleVisionOCR').then(m => ({ default: m.default })));

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      retry: (failureCount, error) => {
        if (failureCount < 2) return true;
        return false;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<EventsDashboard />} />
                <Route path="eventos" element={<EventsListPage />} />
                <Route path="eventos/advanced" element={<EventosAdvancedPage />} />
                <Route path="eventos/clientes" element={<ClientesPage />} />
                <Route path="eventos/facturacion" element={<MasterFacturacionPage />} />
                {/* <Route path="eventos/facturas" element={<FacturasPage />} /> */} {/* ❌ Componente deshabilitado */}
                <Route path="eventos/contabilidad" element={<AccountingStateDashboard />} />
                <Route path="eventos/workflow" element={<WorkflowVisualizationPage />} />
                <Route path="admin/database" element={<DatabaseAdminPage />} />
                <Route path="ocr/test" element={<OcrTestPage />} />
                <Route path="ocr/debug" element={<OCRDebugPage />} />
                <Route path="ocr/simple-debug" element={<SimpleOCRDebugPage />} />
                <Route path="ocr/super-simple" element={<SuperSimpleOCR />} />
                <Route path="ocr/real" element={<RealOCR />} />
                <Route path="ocr/google-vision" element={<GoogleVisionOCR />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;