interface PlaceholderProps {
  title: string;
  body: string;
}

export default function Placeholder({ title, body }: PlaceholderProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-4">
      <h1 className="font-kai text-xl font-bold leading-tight [overflow-wrap:anywhere]">{title}</h1>
      <p className="line-clamp-3 text-sm text-ink-muted [overflow-wrap:anywhere]">{body}</p>
    </div>
  );
}
