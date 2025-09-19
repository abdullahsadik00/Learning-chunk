import React, { useState, useMemo } from 'react'
// import { BarChart3, Calendar, CreditCard, Goal, Home, Investment, PiggyBank, Receipt, TrendingUp, Users, Wallet } from 'lucide-react';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Line } from 'react-chartjs-2';
  
  import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
  } from '@tanstack/react-table';
import CircularProgress from '../components/CircularProgress';
import CustomTable from '../components/CustomTable';
  
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Dashboard = () => {
    const creditCardNumber = '**** **** **** 1234'
    return (
        <div className=''>
            {/* 3 Row Grid */}
            <div className='grid md:grid-cols-3 md:gap-4 grid-cols-1'>
                {/* Credit Card Section */}

                <div className=' col-span-1 flex flex-col gap-4 md:mt-6'>
                    <CreditCard creditCardNumber={creditCardNumber} />

                    {/* Additional Content Blocks */}
                    <div className='flex-1 flex flex-col gap-4'>
                        <div className='-mb-2 text-neutral-700'>Other Accounts</div>
                        <div className=" bg-white flex flex-col justify-between rounded-lg shadow-md p-4 h-full">
                            <h3 className='text-lg'>Additional Block 1</h3>
                            <div className='flex justify-between items-center mt-4'>
                                <div>Salary</div>
                                <div>$1,123</div>
                            </div>
                        </div>
                    </div>

                </div>

                <div className=' col-span-2'>
                    <Transaction />
                </div>
                <div className=' col-span-2'>
                    <ExpenditureReview />
                </div>
            </div>

        </div>
    )
}
const ExpenditureReview = () => {
    const expenses = [
      { title: 'Food', amountSpent: 200, budget: 500 },
      { title: 'Shopping', amountSpent: 150, budget: 300 },
      { title: 'Medicines', amountSpent: 80, budget: 200 },
      { title: 'Med', amountSpent: 1080, budget: 200 },
    ];
  
    const data = {
      labels: expenses.map(e => e.title),
      datasets: [
        {
          label: 'Amount Spent',
          data: expenses.map(e => e.amountSpent),
          borderColor: '#3b82f6', // Tailwind blue-500
          backgroundColor: '#3b82f650',
          fill: false,
          tension: 0.4,
        },
        {
          label: 'Budget',
          data: expenses.map(e => e.budget),
          borderColor: '#10b981', // Tailwind green-500
          backgroundColor: '#10b98150',
          fill: false,
          tension: 0.4,
        },
      ],
    };
  
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#4b5563', // Tailwind gray-700
            font: {
              size: 12,
              family: 'Inter, sans-serif',
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#6b7280' }, // Tailwind gray-500
          grid: {
            color: '#f3f4f6', // Tailwind gray-100
          },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#6b7280' },
          grid: {
            color: '#f3f4f6',
          },
        },
      },
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md h-full">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4">Expenditure Review</h2>
        <div className="h-72">
          <Line data={data} options={options} />
        </div>
      </div>
    );
  }; 

const Goals = () => {
    return <div className='bg-white p-4 rounded-lg shadow-md h-full'>
        <div className='-mb-2 text-neutral-700'>Goals</div>
        <div className='space-y-4 mt-4'>
            {[{
                title: 'New Laptop',
                amountSaved: 800,
                targetAmount: 1200,
            }, {
                title: 'Vacation Trip',
                amountSaved: 300,
                targetAmount: 1000,
            }].map((goal, index) => (
                <div key={index} className='space-y-2'>
                    <div className='flex justify-between items-center'>
                        <h3 className='text-lg font-medium'>{goal.title}</h3>
                        <span className='text-sm text-neutral-500'>{`$${goal.amountSaved} / $${goal.targetAmount}`}</span>
                        <CircularProgress value={Math.min(100, Math.round((goal.amountSaved / goal.targetAmount) * 100))} size={50} stroke={6} />
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-4'>
                        <div className='bg-blue-500 h-4 rounded-full' style={{ width: `${(goal.amountSaved / goal.targetAmount) * 100}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
}
export default Dashboard
const CreditCard = ({ creditCardNumber }) => {
    return <div className="rounded-xl p-4 bg-gradient-to-br from-cyan-400 to-sky-300 text-white shadow shadow-slate-200 h-56
    ">
        <div className='flex justify-between items-center'>
            <span>Debit Card</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-visa">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M21 15l-1 -6l-2.5 6" />
                <path d="M9 15l1 -6" />
                <path d="M3 9h1v6h.5l2.5 -6" />
                <path d="M16 9.5a.5 .5 0 0 0 -.5 -.5h-.75c-.721 0 -1.337 .521 -1.455 1.233l-.09 .534a1.059 1.059 0 0 0 1.045 1.233a1.059 1.059 0 0 1 1.045 1.233l-.09 .534a1.476 1.476 0 0 1 -1.455 1.233h-.75a.5 .5 0 0 1 -.5 -.5" />
                <path d="M18 14h2.7" />
            </svg>
        </div>
        <div className='flex flex-col gap-14'>
            <div>
                <h2 className='text-2xl'>Sadik Shaikh</h2>
                <div>
                    <div>{creditCardNumber}</div>
                </div>
            </div>

            <div className='flex justify-between'>
                <span className='text-sm'>01/25</span>
                <span className='text-lg'>$1234</span>
            </div>
        </div>
    </div>
}


  const Transaction = () => {
    const [filters, setFilters] = useState([]);
    // const columns = useMemo(() => [
    //   {
    //     Header: 'Transactions',
    //     accessor: 'name',
    //   },
    //   {
    //     Header: 'Date',
    //     accessor: 'date',
    //   },
    //   {
    //     Header: 'Category',
    //     accessor: 'category',
    //   },
    //   {
    //     Header: 'Account',
    //     accessor: 'account',
    //   },
    //   {
    //     Header: 'Amount',
    //     accessor: 'amount',
    //   },
    // ], []);
    const [category, setCategory] = useState('All');
    const categories = ['All', 'Food', 'Groceries', 'Medicines', 'Shopping', 'EMI', 'Others'];
    const [openCategoryModal, setOpenCategoryModal] = useState(false);
    const accounts = ['All Accounts', 'Debit Card', 'Credit Card', 'Cash'];
    const [account, setAccount] = useState('All Accounts');
    const [openAccountModal, setOpenAccountModal] = useState(false);
  
    const data = useMemo(() => [
      { name: 'Starbucks Coffee', date: '12 Aug, 2023', category: 'Groceries', account: 'Debit Card', amount: '$5.99' },
      { name: 'Amazon Purchase', date: '14 Aug, 2023', category: 'Shopping', account: 'Credit Card', amount: '$30.00' },
      { name: 'Medicine', date: '15 Aug, 2023', category: 'Medicines', account: 'Cash', amount: '$12.50' },
      { name: 'Groceries', date: '16 Aug, 2023', category: 'Groceries', account: 'Debit Card', amount: '$25.75' },
      { name: 'Electric Bill', date: '17 Aug, 2023', category: 'EMI', account: 'Credit Card', amount: '$50.00' },
    ], []);
  
    const columnHelper = createColumnHelper();
  
    const columns = useMemo(() => [
      columnHelper.accessor('name', {
        header: 'Transactions',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('account', {
        header: 'Account',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: info => info.getValue(),
      }),
    ], []);
  
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });
  
    return (
      <div className="">
        {/* Header */}
        <div className='flex justify-between items-center mt-6 mb-4'>
          <div className='text-sm text-neutral-400 tracking-tight'>Last 5 Transactions</div>
          <div className='flex gap-2'>
            <button
              className="flex items-center gap-2 text-blue-500 text-sm font-medium"
              onClick={() => console.log('Add new transaction')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-circle-plus">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4.929 4.929a10 10 0 1 1 14.141 14.141a10 10 0 0 1 -14.14 -14.14zm8.071 4.071a1 1 0 1 0 -2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0 -2h-2v-2z" />
              </svg>
              Add new
            </button>
          </div>
        </div>
  
        {/* Filters */}
        <div className='flex gap-4 md:flex-row flex-col'>
          {/* Date Picker */}
          <div className='w-full'>
            <span className='text-sm text-neutral-400 tracking-tight'>Date</span>
            <input
              type="date"
              className="outline-none w-full text-sm text-neutral-800 bg-transparent placeholder:text-neutral-400 rounded-md shadow-sm px-3 py-2"
            />
          </div>
  
          {/* Account */}
          <div className='w-full'>
            <span className='text-sm text-neutral-400 tracking-tight'>Account</span>
            <div className="relative">
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 shadow-sm bg-white cursor-pointer"
                onClick={() => setOpenAccountModal(!openAccountModal)}
              >
                <p>{account}</p>
              </div>
              {openAccountModal && (
                <div className="absolute bg-white top-12 w-full border border-gray-300 rounded-md shadow-md z-10 max-h-52 overflow-y-scroll">
                  {accounts.map(acc => (
                    <div
                      key={acc}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setAccount(acc);
                        setOpenAccountModal(false);
                      }}
                    >
                      {acc}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
  
          {/* Category */}
          <div className='w-full'>
            <span className='text-sm text-neutral-400 tracking-tight'>Category</span>
            <div className="relative">
              <div
                className="flex items-center gap-2 rounded-md px-3 py-2 shadow-sm bg-white cursor-pointer"
                onClick={() => setOpenCategoryModal(!openCategoryModal)}
              >
                <p>{category}</p>
              </div>
              {openCategoryModal && (
                <div className="absolute bg-white top-12 w-full border border-gray-300 rounded-md shadow-md z-10 max-h-52 overflow-y-scroll">
                  {categories.map(cat => (
                    <div
                      key={cat}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setCategory(cat);
                        setOpenCategoryModal(false);
                      }}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <CustomTable columns={columns} data={data} filters={filters} setFilters={setFilters} />
  
        {/* Show More Button */}
        <button className="text-sm text-blue-500 shadow-md bg-white py-2 rounded-lg text-center mt-4 w-full">
          Show More
        </button>
      </div>
    );
  };

  const TransactionWithChart = () => {
    const [categoryFilter, setCategoryFilter] = useState('All');
    const categories = ['All', 'Food', 'Groceries', 'Medicines', 'Shopping', 'EMI', 'Others'];
    const [accountFilter, setAccountFilter] = useState('All Accounts');
    const accounts = ['All Accounts', 'Debit Card', 'Credit Card', 'Cash'];
    const [dateRange, setDateRange] = useState('month'); // 'week' | 'month' | 'year'
  
    // Example data
    const data = useMemo(() => [
      { name: 'Salary', date: '2023-01-01', category: 'Income', account: 'Bank', amount: 5000, type: 'income' },
      { name: 'Freelance', date: '2023-01-15', category: 'Income', account: 'Bank', amount: 1200, type: 'income' },
      { name: 'Starbucks', date: '2023-01-05', category: 'Food', account: 'Card', amount: 5.99, type: 'expense' },
      { name: 'Grocery Store', date: '2023-01-10', category: 'Groceries', account: 'Cash', amount: 75.25, type: 'expense' },
      { name: 'Electric Bill', date: '2023-01-12', category: 'EMI', account: 'Credit Card', amount: 100, type: 'expense' },
      // ... more data across months
    ], []);
  
    // Filtering data
    const filteredData = useMemo(() => {
      return data.filter(item => {
        // filter by category
        if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
        // filter by account
        if (accountFilter !== 'All Accounts' && item.account !== accountFilter) return false;
        // filter by date range
        const itemDate = new Date(item.date);
        const now = new Date();
  
        if (dateRange === 'month') {
          // last 30 days
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (itemDate < thirtyDaysAgo) return false;
        } else if (dateRange === 'year') {
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() -1 );
          if (itemDate < yearAgo) return false;
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          if (itemDate < weekAgo) return false;
        }
  
        return true;
      });
    }, [data, categoryFilter, accountFilter, dateRange]);
  
    // Preparing chart data: group by time (e.g. per month)
    const chartData = useMemo(() => {
      // Build structure depending on dateRange
      // For simplicity, let's do monthly buckets when dateRange is 'year' or 'month'
      const buckets = {}; // key: label, value: { income: number, expense: number }
  
      filteredData.forEach(item => {
        const itemDate = new Date(item.date);
        let label;
        if (dateRange === 'year') {
          // each month
          label = itemDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else if (dateRange === 'month') {
          label = itemDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else if (dateRange === 'week') {
          // day of week + date
          label = itemDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
        }
  
        if (!buckets[label]) {
          buckets[label] = { income: 0, expense: 0 };
        }
  
        if (item.type === 'income') {
          buckets[label].income += item.amount;
        } else {
          buckets[label].expense += item.amount;
        }
      });
  
      // Sort labels by date so chart is chronologically ordered
      const sortedLabels = Object.keys(buckets).sort((a, b) => {
        // parse dates from label; simple approach for month-year and day-month
        const da = new Date(a);
        const db = new Date(b);
        return da - db;
      });
  
      const incomeDataset = sortedLabels.map(lbl => buckets[lbl].income);
      const expenseDataset = sortedLabels.map(lbl => buckets[lbl].expense);
  
      return {
        labels: sortedLabels,
        datasets: [
          {
            label: 'Income',
            data: incomeDataset,
            borderColor: '#10b981', // green
            backgroundColor: '#10b98140',
            tension: 0.4,
          },
          {
            label: 'Expenses',
            data: expenseDataset,
            borderColor: '#ef4444', // red
            backgroundColor: '#ef444440',
            tension: 0.4,
          },
        ],
      };
    }, [filteredData, dateRange]);
  
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#374151' // Tailwind gray-700
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          ticks: { color: '#6b7280' },
          grid: { color: '#e5e7eb' } // gray-200
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#6b7280' },
          grid: { color: '#e5e7eb' }
        }
      }
    };
  
    const columnHelper = createColumnHelper();
    const columns = useMemo(() => [
      columnHelper.accessor('name', {
        header: 'Transaction',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('account', {
        header: 'Account',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: info => (item => {
          // format: maybe prefix +/− depending on type
          const amt = info.getValue();
          return item.type === 'expense' ? `- $${amt}` : `$${amt}`;
        })(info.row.original),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: info => info.getValue(),
      }),
    ], []);
  
    const table = useReactTable({
      data: filteredData,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });
  
    return (
      <div className="p-4">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Income vs Expenses ({dateRange})</h2>
          <div className="flex gap-4 mb-4">
            {/* Filters */}
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm text-sm px-2 py-1"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Account</label>
              <select
                value={accountFilter}
                onChange={e => setAccountFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm text-sm px-2 py-1"
              >
                {accounts.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm text-sm px-2 py-1"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
  
        {/* Table Section */}
        <div className='mt-4 bg-white p-4 rounded-lg shadow-md overflow-x-auto'>
          <table className="w-full min-w-max text-sm">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="text-left px-4 py-2 border-b-0 text-neutral-400 font-medium">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-2 text-neutral-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <button className="text-sm text-blue-500 shadow-md bg-white py-2 rounded-lg text-center mt-4 w-full">
          Show More
        </button>
      </div>
    );
  };
  