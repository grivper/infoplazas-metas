/**
 * Módulo: Visitas e Incidencias (Meta 2) + COGNITO
 * Descripción: Punto de entrada con Tabs de nivel superior.
 */
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VisitasView from './VisitasView';
import CognitoView from './CognitoView';
import { IncidenciasView } from './components/IncidenciasView';

const VisitasModule: React.FC = () => {
  return (
    <Tabs defaultValue="meta30" className="w-full">
      <TabsList className="bg-slate-100 p-1 rounded-lg mb-6">
        <TabsTrigger value="meta30" className="rounded-md text-sm font-medium">
          Meta del 30%
        </TabsTrigger>
        <TabsTrigger value="incidencias" className="rounded-md text-sm font-medium">
          Incidencias
        </TabsTrigger>
        <TabsTrigger value="cognito" className="rounded-md text-sm font-medium">
          COGNITO
        </TabsTrigger>
      </TabsList>
      <TabsContent value="meta30">
        <VisitasView />
      </TabsContent>
      <TabsContent value="incidencias">
        <IncidenciasView />
      </TabsContent>
      <TabsContent value="cognito">
        <CognitoView />
      </TabsContent>
    </Tabs>
  );
};

export default VisitasModule;
