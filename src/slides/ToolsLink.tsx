import { copy } from '../content/copy';

export default function ToolsLink() {
  return (
    <a className="break-words text-lg text-emerald-700 underline" href="#/tools" target="_blank" rel="noopener noreferrer">
      {copy.tools.linkLabel}
    </a>
  );
}
