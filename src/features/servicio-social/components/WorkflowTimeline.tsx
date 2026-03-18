import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { Fragment } from 'react';

interface Workflow {
  phase: string;
  dates: string;
  desc: string;
  status: 'Completado' | 'En curso' | 'Planificado';
}

interface WorkflowTimelineProps {
  workflows: Workflow[];
}

export function WorkflowTimeline({ workflows }: WorkflowTimelineProps) {
  return (
    <Card className="border-none shadow-sm bg-white/50">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="hidden lg:block absolute top-[28%] left-[10%] right-[10%] h-0.5 bg-slate-100 -z-10" />
          {workflows.map((flow, idx) => (
            <Fragment key={idx}>
              <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 p-5 shadow-sm relative z-10 transition-transform hover:-translate-y-1 duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fase {idx + 1}</span>
                    <h3 className="text-lg font-bold text-slate-800 mt-0.5">{flow.phase}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{flow.dates}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      flow.status === 'Completado'
                        ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                        : flow.status === 'En curso'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-slate-300 text-slate-500 bg-slate-50'
                    }
                  >
                    {flow.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{flow.desc}</p>
              </div>
              {idx < workflows.length - 1 && (
                <>
                  <div className="hidden lg:flex items-center justify-center text-slate-300 w-12 shrink-0">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <div className="lg:hidden flex justify-center w-full py-2">
                    <ArrowRight className="w-5 h-5 text-slate-300 rotate-90" />
                  </div>
                </>
              )}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
