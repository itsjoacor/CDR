
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const modules = [
    {
      path: '/receta',
      title: 'Receta',
      icon: '📋',
      description: 'Gestionar materiales, cantidades, MO y energía para fabricar productos',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      canEdit: user?.role === 'admin'
    },
    {
      path: '/insumos',
      title: 'Insumos',
      icon: '📦',
      description: 'Catálogo de materiales comprados externamente',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      canEdit: user?.role === 'admin'
    },
    {
      path: '/productos',
      title: 'Productos',
      icon: '🛒',
      description: 'Configurar tiempos, salarios y fórmulas de trabajo humano',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      canEdit: user?.role === 'admin'
    },
    {
      path: '/mano-obra',
      title: 'Mano de Obra',
      icon: '👷',
      description: 'Configurar tiempos, salarios y fórmulas de trabajo humano',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      canEdit: user?.role === 'admin'
    },
    
    
    {
      path: '/mano-energia',
      title: 'Mano de Energía',
      icon: '⚡',
      description: 'Administrar recursos energéticos y sus cálculos internos',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
      canEdit: user?.role === 'admin'
    },
    {
      path: '/resultados-cdr',
      title: 'CDR (Código Directo de Reposición)',
      icon: '💰',
      description: 'Visualizar costos calculados automáticamente para reposición',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      canEdit: false
    }
  ];

  return (
    <Layout title="Panel de Control">
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">
              Bienvenido, {user?.name} 👋
            </CardTitle>
            <CardDescription className="text-blue-100">
              Sistema de gestión para estructura productiva textil - Cálculo automatizado del CDR
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Link key={module.path} to={module.path} className="block">
              <Card className={`h-full transition-all duration-200 ${module.color}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{module.icon}</div>
                    <div className="flex space-x-2">
                      {module.canEdit ? (
                        <Badge variant="default">Editable</Badge>
                      ) : (
                        <Badge variant="secondary">Solo lectura</Badge>
                      )}
                      {module.path === '/resultados-cdr' && (
                        <Badge variant="outline" className="bg-green-100">
                          Auto-calculado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-muted-foreground">Recetas Activas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-muted-foreground">Tipos de MO</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">8</div>
              <div className="text-sm text-muted-foreground">Fuentes de Energía</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">45</div>
              <div className="text-sm text-muted-foreground">Insumos</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
