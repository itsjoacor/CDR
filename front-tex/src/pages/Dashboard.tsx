
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  Package,
  ShoppingCart,
  HardHat,
  Zap,
  DollarSign,
  Hand
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const modules = [
    {
      path: '/receta',
      title: 'Receta',
      icon: ClipboardList,
      iconColor: 'text-sky-400',
      description: 'Gestionar materiales, cantidades, MO y energía para fabricar productos',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      canEdit: user?.role === 'admin',
    },
    {
      path: '/insumos',
      title: 'Insumos',
      icon: Package,
      iconColor: 'text-purple-400',
      description: 'Catálogo de materiales comprados externamente',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      canEdit: user?.role === 'admin',
    },
    {
      path: '/producto',
      title: 'Productos',
      icon: ShoppingCart,
      iconColor: 'text-orange-300',
      description: 'Configurar tiempos, salarios y fórmulas de trabajo humano',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      canEdit: user?.role === 'admin',
    },
    {
      path: '/mano-obra',
      title: 'Mano de Obra',
      icon: HardHat,
      iconColor: 'text-orange-400',
      description: 'Configurar tiempos, salarios y fórmulas de trabajo humano',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      canEdit: user?.role === 'admin',
    },
    {
      path: '/mano-energia',
      title: 'Mano de Energía',
      icon: Zap,
      iconColor: 'text-yellow-400',
      description: 'Administrar recursos energéticos y sus cálculos internos',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      canEdit: user?.role === 'admin',
    },
    {
      path: '/resultados-cdr',
      title: 'CDR (Código Directo de Reposición)',
      icon: DollarSign,
      iconColor: 'text-green-400',
      description: 'Visualizar costos calculados automáticamente para reposición',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      canEdit: false,
    },
  ];

  return (
    <Layout title="Panel de Control">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-3">
              <Hand className="w-6 h-6 text-white/90" />
              <CardTitle className="text-2xl font-bold tracking-tight">
                Bienvenido!
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-blue-100">
              Sistema de gestión para estructura productiva textil · Cálculo automatizado del CDR
            </CardDescription>
          </CardHeader>
        </Card>



        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(({ path, title, description, icon: Icon, iconColor, color, canEdit }) => (
            <Link
              to={path}
              key={path}
              className={`border rounded-lg p-4 transition-colors ${color} block`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h4 className="text-lg font-semibold">{title}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
              {canEdit && (
                <span className="mt-2 inline-block text-xs text-primary font-medium">
                  Puedes editar este módulo
                </span>
              )}
            </Link>
          ))}

        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
