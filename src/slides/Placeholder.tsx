interface PlaceholderProps {
  title: string;
  body: string;
}

export default function Placeholder({ title, body }: PlaceholderProps) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6 sm:p-12">
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{title}</h1>
      <p className="text-lg text-slate-600 sm:text-2xl">{body}</p>
    </div>
  );
}
