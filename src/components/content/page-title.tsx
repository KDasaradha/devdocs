interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  return (
    <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8 pb-2 border-b border-border">
      {title}
    </h1>
  );
}
