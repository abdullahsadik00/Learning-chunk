import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

// Utility to format month-year from date
const getMonthFromDate = (date) => {
  const options = { month: 'short', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

const CustomTable = ({ columns, data }) => {
  const [filters, setFilters] = useState({ month: '', category: '' });
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  // Use deferred filters for smoother UI
  const deferredFilters = useDeferredValue(filters);

  // Memoize unique months and categories for dropdowns
  const uniqueMonths = useMemo(() => {
    return Array.from(new Set(data.map((row) => getMonthFromDate(row.Date))));
  }, [data]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(data.map((row) => row.Category)));
  }, [data]);

  // Filter data with memoization
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const isMonthMatch = deferredFilters.month
        ? getMonthFromDate(row.Date) === deferredFilters.month
        : true;
      const isCategoryMatch = deferredFilters.category
        ? row.Category === deferredFilters.category
        : true;
      return isMonthMatch && isCategoryMatch;
    });
  }, [data, deferredFilters]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      currentPage * rowsPerPage,
      (currentPage + 1) * rowsPerPage
    );
  }, [filteredData, currentPage]);

  // React Table instance
  const table = useReactTable({
    columns,
    data: paginatedData,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleMonthChange = (e) => {
    setCurrentPage(0); // Reset page on filter change
    setFilters((prev) => ({ ...prev, month: e.target.value }));
  };

  const handleCategoryChange = (e) => {
    setCurrentPage(0); // Reset page on filter change
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) =>
      Math.min(prev + 1, Math.ceil(filteredData.length / rowsPerPage) - 1)
    );
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4">
        <label className="mr-2">Month:</label>
        <select value={filters.month} onChange={handleMonthChange}>
          <option value="">All</option>
          {uniqueMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <label className="ml-4 mr-2">Category:</label>
        <select value={filters.category} onChange={handleCategoryChange}>
          <option value="">All</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden shadow-sm sm:rounded-lg border border-gray-200">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left font-medium border-b border-gray-200"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-gray-800">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center px-4 py-4 text-gray-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button onClick={handlePrevPage} disabled={currentPage === 0}>
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {Math.ceil(filteredData.length / rowsPerPage)}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= Math.ceil(filteredData.length / rowsPerPage) - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CustomTable;
