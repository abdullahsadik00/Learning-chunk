import React from 'react'

const Hero = () => {
    return (
        <div className='heroRoot'>
            <div className='badge'>
                <span>Incorporation common mistakes to avoid</span>
                <svg width="16" height="16" fill="none">
                    <path
                        stroke="#1E1F25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeOpacity=".5"
                        strokeWidth="1.25"
                        d="M8 4.75 11.25 8m0 0L8 11.25M11.25 8h-6.5"
                    />
                </svg>
            </div>
            <div>
                <h1 className='heroText'>Magically simplify <br /> accounting and taxes</h1>
                <p className='subText'>Automated bookkeeping, effortless tax filing, real‑time insights. Set up in 10 mins. Back to building by 8:32pm.                </p>
            </div>

            <div className="heroCTA">
                <button className='btnPrimary'>Get Started</button>
                <button className='btnSecondary'>
                    <span>Pricing</span>
                    <svg width="16" height="16" fill="none">
                        <path
                            stroke="#1E1F25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity=".5"
                            strokeWidth="1.25"
                            d="M8 4.75 11.25 8m0 0L8 11.25M11.25 8h-6.5"
                        />
                    </svg>
                </button>
            </div>

            <div className='info-text'>
            Currently for IND-based Delaware C-Corps.
            </div>
        </div>
    )
}

export default Hero