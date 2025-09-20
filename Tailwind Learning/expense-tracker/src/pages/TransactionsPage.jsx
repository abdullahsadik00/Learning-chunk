import React from 'react'
import CustomTable from '../components/CustomTable';
import data from '../data/transactions.json';

const TransactionsPage = () => {
  const columns = [
    {
      header: 'Date',
      accessorKey: 'Date',
    },
    {
      header: 'Details',
      accessorKey: 'Details',
    },
    {
      header: 'Debit',
      accessorKey: 'Debit',
    },
    {
      header: 'Credit',
      accessorKey: 'Credit',
    },
    {
      header: 'Balance',
      accessorKey: 'Balance',
    },
    {
      header: 'Category',
      accessorKey: 'Category',
    },
    // Add other columns as needed
  ];
  return (
    <div>TransactionsPage
      <CustomTable columns={columns} data={data} />

    </div>
  )
}

export default TransactionsPage