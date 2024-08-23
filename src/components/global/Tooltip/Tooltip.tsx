import React, { useEffect, useRef, useState } from "react";

import TooltipText from "./TooltipText";

interface Props {
  children: React.ReactNode;
  direction?: "top" | "bottom" | "left" | "right";
  text: string;
  offset?: number;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  lg?: boolean;
  visible?: boolean;
}

const Tooltip = ({
  children,
  direction,
  text,
  offset,
  disabled,
  className,
  onClick,
  lg,
  visible,
}: Props) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const [fromTop, setFromTop] = useState<number>(0);
  const [fromLeft, setFromLeft] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const show = () => {
    if (!mounted || disabled) return;
    setOpen(true);

    // const box = e.target.lastElementChild || e.target.lastChild || e.target;
    // const trigger = e.target.getBoundingClientRect();
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { top, left, width, height } = rect;
    const { scrollTop, scrollLeft } = document.body;

    const topDis = top + scrollTop - 0;
    const leftDis = left + scrollLeft - 0;

    const useOffset = offset || 10;

    if (direction === "top" || !direction) {
      setFromTop(Math.round(topDis) - height - useOffset);
      setFromLeft(Math.round(leftDis) + width / 2);
    } else if (direction === "left") {
      setFromTop(Math.round(topDis) + height / 2);
      setFromLeft(Math.round(leftDis) - useOffset);
    } else if (direction === "bottom") {
      setFromTop(Math.round(topDis) + height + useOffset);
      setFromLeft(Math.round(leftDis) + width / 2);
    } else if (direction === "right") {
      setFromTop(Math.round(topDis) + height / 2);
      setFromLeft(Math.round(leftDis) + width + useOffset);
    }
  };

  const hide = () => {
    if ((disabled && !open) || visible) return;
    setOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <span
        onMouseEnter={(_) => show()}
        onFocus={(_) => show()}
        onMouseLeave={() => hide()}
        onBlur={() => hide()}
        className={`inline ${className || ""}`}
        onClick={onClick && onClick}
        ref={inputRef}
      >
        {children}
      </span>

      {!disabled && (
        <TooltipText
          open={open}
          text={text}
          direction={direction}
          fromTop={fromTop}
          fromLeft={fromLeft}
          lg={lg}
        />
      )}
    </>
  );
};

export default Tooltip;
