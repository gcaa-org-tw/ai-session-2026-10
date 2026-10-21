export default function ExternalLink({ href }: { href: string }) {
  return (
    <a className="break-all text-emerald-700 underline" href={href} target="_blank" rel="noopener noreferrer">
      {href}
    </a>
  );
}
