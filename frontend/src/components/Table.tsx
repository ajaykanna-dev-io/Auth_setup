import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found",
  keyExtractor,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`standard-table-wrapper ${className}`}>
      <div className="table-responsive">
        <table className="standard-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || "left",
                  }}
                  className={col.className || ""}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="table-state-cell">
                  <div className="table-loader">
                    <span className="spinner spinner--sm" />
                    <span>Loading data…</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-state-cell">
                  <div className="table-empty">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-4a2 2 0 0 1-2-2 2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2 2 2 0 0 1-2 2H4" />
                    </svg>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const rowKey = keyExtractor
                  ? keyExtractor(item, index)
                  : ((item as Record<string, unknown>).id as string | number) ??
                    index;

                return (
                  <tr key={rowKey} className="standard-table__row">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align || "left",
                        }}
                        className={col.className || ""}
                      >
                        {col.render
                          ? col.render(item, index)
                          : ((item as Record<string, unknown>)[
                              col.key
                            ] as React.ReactNode) ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
