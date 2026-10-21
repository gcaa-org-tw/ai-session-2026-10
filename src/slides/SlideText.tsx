interface SlideTextProps {
  title: string;
  body: string[];
  compact?: boolean;
}

export default function SlideText({ title, body, compact = false }: SlideTextProps) {
  const frame = compact ? 'flex flex-col gap-2 p-4 sm:p-8' : 'flex h-full flex-col justify-center gap-4 p-6 sm:p-12';
  const heading = compact ? 'text-2xl font-bold leading-tight sm:text-3xl' : 'text-3xl font-bold leading-tight sm:text-5xl';
  const text = compact ? 'text-base text-slate-600 sm:text-lg' : 'text-lg text-slate-600 sm:text-2xl';
  return (
    <div className={frame}>
      <h1 className={`${heading} [overflow-wrap:anywhere]`}>{title}</h1>
      {body.map((paragraph, i) => (
        <p key={i} className={`${text} [overflow-wrap:anywhere]`}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
