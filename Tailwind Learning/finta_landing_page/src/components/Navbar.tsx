import React from "react";

const Navbar = () => {
  const links = [
    {
      linkText: "Founders",
      href: "#",
    },
    {
      linkText: "Guide",
      href: "#",
    },
    {
      linkText: "Pricing",
      href: "#",
    },
    {
      linkText: "Log In",
      href: "#",
    },
  ];
  return (
    <div className="flex items-center justify-between py-4">
      <h2 className="logo">Finta</h2>
      <div className="flex items-center gap-4">
        {links.map((el, idx) => (
          <a
            href={el.href}
            key={idx}
            className="font-medium text-neutral-800 transition duration-200 hover:text-neutral-500"
          >
            {el.linkText}
          </a>
        ))}
        <button className="rounded-md bg-[#2579f4] px-4 py-2 text-white shadow-lg text-shadow-md">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Navbar;
