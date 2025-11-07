'use client';

/**
 * Screen Reader Accessible Data Table
 *
 * Provides tabular data for screen readers to access chart data.
 * Hidden visually but readable by assistive technologies.
 */

interface ScreenReaderTableProps {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}

export function ScreenReaderTable({ caption, headers, rows }: ScreenReaderTableProps) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={idx}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
