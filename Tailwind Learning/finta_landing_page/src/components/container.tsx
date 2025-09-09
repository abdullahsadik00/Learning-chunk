import React from "react";
import { cn } from "../utils/utils";

const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn("z-10 mx-auto w-full max-w-7xl px-4 md:py-8", className)}
    >
      {children}
    </div>
  );
};

export default Container;
