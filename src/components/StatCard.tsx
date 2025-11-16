import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, className }: StatCardProps) => {
  return (
    <Card className={`p-6 hover:shadow-[var(--shadow-medical)] transition-all duration-300 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && <p className="text-xs text-success">{trend}</p>}
        </div>
        <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </Card>
  );
};
