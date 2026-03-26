interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-fade-up">
      <h1 className="font-heading text-3xl tracking-tight text-smu-text">
        {title}
      </h1>
      <div className="h-0.5 w-12 bg-smu-gold rounded-full mt-3 animate-gold-draw" />
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-3">{subtitle}</p>
      )}
    </div>
  );
}
