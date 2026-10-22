export default function ExternalLink({ href }: { href: string }) {
  return (
    <a className="break-all text-ink underline" href={href} target="_blank" rel="noopener noreferrer">
      {href}
    </a>
  );
}
