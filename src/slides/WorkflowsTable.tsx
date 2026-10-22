import { copy } from '../content/copy';
import type { WorkflowColumn } from '../content/copy';
import { wrapText } from '../activities/ui';

const COLUMNS: WorkflowColumn[] = ['gave', 'context', 'did', 'mine'];

export default function WorkflowsTable() {
  const { columns, rows } = copy.workflows;
  return (
    <div className="min-w-0">
      <table data-testid="workflows-table" className="hidden w-full table-fixed border-collapse text-left align-top text-sm md:table lg:text-base">
        <thead>
          <tr className="text-ink-muted">
            <th scope="col" className="w-1/6 p-2" />
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={`p-2 font-semibold ${wrapText}`}>
                {columns[column]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-grid-soft align-top">
              <th scope="row" className={`p-2 font-semibold ${wrapText}`}>
                {row.name}
              </th>
              {COLUMNS.map((column) => (
                <td key={column} className={`p-2 ${wrapText}`}>
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul data-testid="workflows-cards" className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.name} className="rounded-lg border border-grid-soft p-3">
            <h2 className={`mb-2 text-lg font-semibold ${wrapText}`}>{row.name}</h2>
            <dl className="flex flex-col gap-2">
              {COLUMNS.map((column) => (
                <div key={column}>
                  <dt className={`text-sm font-semibold text-ink-muted ${wrapText}`}>{columns[column]}</dt>
                  <dd className={`text-base text-ink ${wrapText}`}>{row[column]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
