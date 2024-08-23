import React, { useEffect, useState } from "react";
import ReactDom from "react-dom";

interface Props {
  open: boolean;
  direction?: "top" | "bottom" | "left" | "right";
  text: string;
  fromTop: number;
  fromLeft: number;
  lg?: boolean;
}

const TooltipText = ({
  open,
  direction,
  text,
  fromTop,
  fromLeft,
  lg,
}: Props) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const component = (
    <>
      <span
        className={`fixed z-90 rounded-sm bg-tooltip px-3 py-2 font-medium text-tooltip-fg after:absolute after:border-[5px] after:border-transparent after:content-[''] ${
          lg ? "text-base" : "text-sm"
        } ${!open && "invisible scale-90 opacity-0"} ${
          direction === "top" || !direction
            ? "origin-bottom -translate-x-1/2 after:left-1/2 after:top-full after:-translate-x-1/2 after:border-t-tooltip"
            : direction === "left"
              ? "-mt-1 origin-right -translate-x-full -translate-y-1/2 after:left-full after:top-1/2 after:-translate-y-1/2 after:border-l-tooltip"
              : direction === "bottom"
                ? "origin-top -translate-x-1/2 after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-b-tooltip"
                : direction === "right" &&
                  "-mt-1 origin-left -translate-y-1/2 after:right-full after:top-1/2  after:-translate-y-1/2 after:border-r-tooltip"
        }`}
        style={{
          top: fromTop,
          left: fromLeft,
          transitionProperty: "transform, opacity, visibility",
          transitionDuration: "100ms",
        }}
      >
        {direction === "left" || direction === "right" ? (
          <p className="-mt-px">{text || "Tooltip"}</p>
        ) : (
          text || "Tooltip"
        )}
      </span>
    </>
  );

  return mounted ? ReactDom.createPortal(component, document.body) : null;
};

export default TooltipText;
