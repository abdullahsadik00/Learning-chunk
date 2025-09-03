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
    <div className='navbar'>
        <h2 className='logo'>Finta</h2>
        <div className='links'>
            {links.map((el,idx)=>
            <a href={el.href} key={idx} className='link-items text-sm'>
                {el.linkText}
            </a>
            )}
            <button className='btnPrimary'>Get Started</button>
        </div>
    </div>
  )
}

export default Navbar