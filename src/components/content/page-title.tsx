interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  return (
    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-6">
      {title}
    </h1>
  );
}