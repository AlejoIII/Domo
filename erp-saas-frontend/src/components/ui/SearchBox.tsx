import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBox({ value, onChange, placeholder = 'Buscar...', className }: SearchBoxProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border/70 bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
