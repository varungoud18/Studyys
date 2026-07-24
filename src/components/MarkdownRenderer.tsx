import React from 'react';

const renderInlineText = (text: string) => {
  const parts = [];
  let index = 0;
  // Regex to match **bold** or `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > index) {
      parts.push(text.substring(index, match.index));
    }
    const matchText = match[0];
    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">
          {matchText.slice(2, -2)}
        </strong>
      );
    } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-red-500 font-mono text-xs">
          {matchText.slice(1, -1)}
        </code>
      );
    }
    index = regex.lastIndex;
  }
  if (index < text.length) {
    parts.push(text.substring(index));
  }
  return parts.length > 0 ? parts : text;
};

interface TableRow {
  cells: string[];
}

export const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentTable: { headers: string[]; rows: TableRow[] } | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let currentList: { items: string[]; ordered: boolean } | null = null;

  const flushTable = (key: number) => {
    if (!currentTable) return null;
    const table = (
      <div key={`table-${key}`} className="my-4 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
              {currentTable.headers.map((h, i) => (
                <th key={i} className="p-3 font-semibold uppercase tracking-wider">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {currentTable.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300 transition-colors">
                {row.cells.map((cell, j) => (
                  <td key={j} className="p-3">{renderInlineText(cell.trim())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTable = null;
    return table;
  };

  const flushCodeBlock = (key: number) => {
    if (!inCodeBlock) return null;
    const code = (
      <pre key={`code-${key}`} className="my-3 p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
        <code>{codeBlockContent.join('\n')}</code>
      </pre>
    );
    codeBlockContent = [];
    inCodeBlock = false;
    return code;
  };

  const flushList = (key: number) => {
    if (!currentList) return null;
    const list = currentList.ordered ? (
      <ol key={`list-${key}`} className="list-decimal pl-6 my-2 space-y-1 text-slate-700 dark:text-slate-300">
        {currentList.items.map((item, i) => (
          <li key={i}>{renderInlineText(item)}</li>
        ))}
      </ol>
    ) : (
      <ul key={`list-${key}`} className="list-disc pl-6 my-2 space-y-1 text-slate-700 dark:text-slate-300">
        {currentList.items.map((item, i) => (
          <li key={i}>{renderInlineText(item)}</li>
        ))}
      </ul>
    );
    currentList = null;
    return list;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        const rendered = flushCodeBlock(i);
        if (rendered) elements.push(rendered);
      } else {
        if (currentTable) {
          const rendered = flushTable(i);
          if (rendered) elements.push(rendered);
        }
        if (currentList) {
          const rendered = flushList(i);
          if (rendered) elements.push(rendered);
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle Tables
    if (line.trim().startsWith('|')) {
      if (currentList) {
        const rendered = flushList(i);
        if (rendered) elements.push(rendered);
      }

      const isSeparator = /^\|\s*(:?-+:?\s*\|)+\s*$/.test(line.trim());
      if (isSeparator) {
        continue;
      }

      const cells = line
        .split('|')
        .slice(1, -1);
      
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push({ cells });
      }
      continue;
    } else {
      if (currentTable) {
        const rendered = flushTable(i);
        if (rendered) elements.push(rendered);
      }
    }

    // Handle list items
    const unorderedMatch = line.match(/^(\s*)[*\-]\s+(.*)$/);
    const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

    if (unorderedMatch) {
      const content = unorderedMatch[2];
      if (!currentList || currentList.ordered) {
        if (currentList) {
          const rendered = flushList(i);
          if (rendered) elements.push(rendered);
        }
        currentList = { items: [content], ordered: false };
      } else {
        currentList.items.push(content);
      }
      continue;
    } else if (orderedMatch) {
      const content = orderedMatch[2];
      if (!currentList || !currentList.ordered) {
        if (currentList) {
          const rendered = flushList(i);
          if (rendered) elements.push(rendered);
        }
        currentList = { items: [content], ordered: true };
      } else {
        currentList.items.push(content);
      }
      continue;
    } else {
      if (currentList) {
        const rendered = flushList(i);
        if (rendered) elements.push(rendered);
      }
    }

    // Handle Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      const headingClasses = [
        "",
        "text-xl font-extrabold text-slate-800 dark:text-slate-100 my-4",
        "text-lg font-bold text-slate-800 dark:text-slate-100 my-3",
        "text-base font-bold text-slate-800 dark:text-slate-200 my-2",
        "text-sm font-bold text-slate-800 dark:text-slate-200 my-2",
        "text-xs font-bold text-slate-705 dark:text-slate-300 my-1",
        "text-xs font-bold text-slate-705 dark:text-slate-300 my-1"
      ];
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      elements.push(
        <HeadingTag key={i} className={headingClasses[level]}>
          {renderInlineText(title)}
        </HeadingTag>
      );
      continue;
    }

    // Regular line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="leading-relaxed mb-2 text-slate-700 dark:text-slate-300">
          {renderInlineText(line)}
        </p>
      );
    }
  }

  if (currentTable) {
    const rendered = flushTable(lines.length);
    if (rendered) elements.push(rendered);
  }
  if (inCodeBlock) {
    const rendered = flushCodeBlock(lines.length);
    if (rendered) elements.push(rendered);
  }
  if (currentList) {
    const rendered = flushList(lines.length);
    if (rendered) elements.push(rendered);
  }

  return <div className="space-y-1">{elements}</div>;
};
