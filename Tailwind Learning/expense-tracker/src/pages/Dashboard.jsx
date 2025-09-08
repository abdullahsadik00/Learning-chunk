import React from 'react'

const Dashboard = () => {
    const creditCardNumber = '**** **** **** 1234'
    return (
        <div>
            {/* 3 Row Grid */}
            <div className='grid grid-rows-3 gap-4 h-[400px]'>
                <div className='bg-amber-50 row-span-1'></div>
                <div className='bg-amber-50 row-span-2'></div>
            </div>

            {/* Credit Card Section */}
            <div className='grid grid-cols-3 gap-4 mt-6'>
                <div className="col-span-3 bg-red-200 rounded-xl p-4 bg-gradient-to-br from-cyan-400 to-sky-300 text-white shadow shadow-slate-200">
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
                    <div>
                        <h2 className='text-2xl'>Sadik Shaikh</h2>
                        <div>
                            <div>{creditCardNumber}</div>
                        </div>
                        <div className='flex justify-between pt-12'>
                            <span className='text-sm'>01/25</span>
                            <span className='text-lg'>$1234</span>
                        </div>
                    </div>
                </div>

                {/* Additional Content Blocks */}
                <div className="col-span-3 bg-blue-200 p-4">
                    <h3 className='text-lg'>Additional Block 1</h3>
                </div>
                <div className="col-span-3 bg-cyan-200 p-4">
                    <h3 className='text-lg'>Additional Block 2</h3>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
