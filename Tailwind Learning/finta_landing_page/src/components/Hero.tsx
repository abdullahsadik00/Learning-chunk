import React from "react";

const Hero = () => {
  return (
    <div className="heroRoot">
      <div className="mx-auto flex w-fit cursor-pointer items-center gap-2 rounded-full border border-neutral-300/40 bg-neutral-200/40 px-4 py-1 text-neutral-500 transition duration-200 ease-in-out hover:bg-neutral-200">
        <span className="text-sm">Incorporation common mistakes to avoid</span>
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
        <h1 className="text-center text-6xl font-black tracking-tight">
          Magically simplify <br /> accounting and taxes
        </h1>
        <p className="my-6 text-center text-base text-neutral-500">
          Automated bookkeeping, effortless tax filing, real‑time insights. Set
          up in 10 mins. Back to building by 8:32pm.{" "}
        </p>
      </div>

      <div className="heroCTA">
        <button className="btnPrimary">Get Started</button>
        <button className="btnSecondary">
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

      <div className="info-text">Currently for IND-based Delaware C-Corps.</div>
      <h1 className="text-3xl font-bold underline"></h1>
    </div>
  );
};

export default Hero;
