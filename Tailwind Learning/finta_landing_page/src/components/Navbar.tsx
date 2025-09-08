import React from 'react'

const Navbar = () => {
    const links = [
        {
            linkText : 'Founders',
            href : '#'
        },
        {
            linkText : 'Guide',
            href : '#'
        },
        {
            linkText : 'Pricing',
            href : '#'
        },
        {
            linkText : 'Log In',
            href : '#'
        }
    ]
  return (
    <div className='flex items-center justify-between py-4'>
        <h2 className='logo'>Finta</h2>
        <div className='flex items-center gap-4'>
            {links.map((el,idx)=>
            <a href={el.href} key={idx} className='text-neutral-800 font-medium hover:text-neutral-500 transition duration-200'>
                {el.linkText}
            </a>
            )}
            <button className='bg-[#2579f4] text-white px-4 py-2 rounded-md shadow-lg text-shadow-md'>Get Started</button>
        </div>
    </div>
  )
}

export default Navbar