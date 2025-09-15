import React from 'react'

const Dashboard = () => {
    const creditCardNumber = '**** **** **** 1234'
    return (
        <div className=''>
            {/* 3 Row Grid */}
            <div className='grid grid-cols-3 gap-4 '>
                {/* Credit Card Section */}

                <div className=' col-span-1 flex flex-col gap-4 mt-6'>
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
            </div>

        </div>
    )
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
    return <div>

        <div className='flex justify-between items-center mt-6 mb-4'>
            <div className='text-sm text-neutral-400 tracking-tight'>Last 5 Transactions</div>
            <div className='flex gap-2'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500 icon icon-tabler icons-tabler-filled icon-tabler-circle-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4.929 4.929a10 10 0 1 1 14.141 14.141a10 10 0 0 1 -14.14 -14.14zm8.071 4.071a1 1 0 1 0 -2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0 -2h-2v-2z" /></svg>
                <span className='text-sm text-neutral-800 font-medium'>
                    Add new
                </span>
            </div>
        </div>
        <div className='flex gap-4'>
            <div className='w-full'>
                <span className='text-sm text-neutral-400 tracking-tight'>Date</span>
                <div class="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm bg-white">
                    <span class="text-neutral-800">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-event">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                            <path d="M16 3l0 4" />
                            <path d="M8 3l0 4" />
                            <path d="M4 11l16 0" />
                            <path d="M8 15h2v2h-2z" />
                        </svg>
                    </span>
                    <input
                        type="date"
                        class="outline-none w-full text-sm text-neutral-800 bg-transparent placeholder:text-neutral-400"
                    />
                </div>
            </div>
            <div className='w-full'>
                <span className='text-sm text-neutral-400 tracking-tight'>Date</span>
                <div class="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm bg-white">
                    <span class="text-neutral-800">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-event">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                            <path d="M16 3l0 4" />
                            <path d="M8 3l0 4" />
                            <path d="M4 11l16 0" />
                            <path d="M8 15h2v2h-2z" />
                        </svg>
                    </span>
                    <input
                        type="date"
                        class="outline-none w-full text-sm text-neutral-800 bg-transparent placeholder:text-neutral-400"
                    />
                </div>
            </div>
            <div className='w-full'>
                <span className='text-sm text-neutral-400 tracking-tight'>Date</span>
                <div class="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 shadow-sm bg-white">
                    <span class="text-neutral-800">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="icon icon-tabler icons-tabler-outline icon-tabler-calendar-event">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
                            <path d="M16 3l0 4" />
                            <path d="M8 3l0 4" />
                            <path d="M4 11l16 0" />
                            <path d="M8 15h2v2h-2z" />
                        </svg>
                    </span>
                    <input
                        type="date"
                        class="outline-none w-full text-sm text-neutral-800 bg-transparent placeholder:text-neutral-400"
                    />
                </div>
            </div>
        </div>
        <div className='mt-4 space-y-4 bg-white p-4 rounded-lg shadow-md'>
            {/* row */}
            <div className='grid grid-cols-6'>
                <div className='col-span-2 text-sm text-neutral-400'>Transactions</div>
                <div className='col-span-1 text-sm text-neutral-400 text-center'>Date</div>
                <div className='col-span-1 text-sm text-neutral-400 text-center'>Category</div>
                <div className='col-span-1 text-sm text-neutral-400 text-center'>Account</div>
                <div className='col-span-1 text-sm text-neutral-400 text-right'>Ammount</div>
            </div>
            <div className='grid grid-cols-6'>
                <div className='col-span-2 text-sm text-neutral-800 font-medium'>Starbucks Coffee</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>12 Aug, 2023</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>
                    <span className='bg-emerald-200 py-1 px-2.5 rounded-full text-emerald-700'>Food</span>
                </div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>Debit Card</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-right'>$5.99</div>
            </div>
            <div className='grid grid-cols-6'>
                <div className='col-span-2 text-sm text-neutral-800 font-medium'>Starbucks Coffee</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>12 Aug, 2023</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>
                    <span className='bg-sky-200 py-1 px-2.5 rounded-full text-sky-700'>Groceries</span>
                </div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>Debit Card</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-right'>$5.99</div>
            </div>
            <div className='grid grid-cols-6'>
                <div className='col-span-2 text-sm text-neutral-800 font-medium'>Starbucks Coffee</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>12 Aug, 2023</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>
                    <span className='bg-sky-200 py-1 px-2.5 rounded-full text-sky-700'>Groceries</span>
                </div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>Debit Card</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-right'>$5.99</div>
            </div>
            <div className='grid grid-cols-6'>
                <div className='col-span-2 text-sm text-neutral-800 font-medium'>Starbucks Coffee</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>12 Aug, 2023</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>
                    <span className='bg-sky-200 py-1 px-2.5 rounded-full text-sky-700'>Groceries</span>
                </div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>Debit Card</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-right'>$5.99</div>
            </div>
            <div className='grid grid-cols-6'>
                <div className='col-span-2 text-sm text-neutral-800 font-medium'>Starbucks Coffee</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>12 Aug , 2023</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>
                    <span className='bg-red-300 py-1 px-2.5 rounded-full text-red-700'>Medicines</span>
                </div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-center'>Debit Card</div>
                <div className='col-span-1 text-sm text-neutral-800 font-medium text-right'>$5.99</div>
            </div>
        </div>
        <div className='text-sm text-blue-500 text-shadow-sm shadow-md bg-white py-2 rounded-lg text-center mt-4 cursor-pointer'>
            Show More
        </div>
    </div>
}