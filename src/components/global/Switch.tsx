import clsx from "clsx";
import React from "react";

interface Props {
  value: boolean;
  onChange?: (value: boolean) => void;
  size?: "small" | "large";
  color?: string;
  className?: string;
}

function Switch({ value, onChange, size, color, className }: Props) {
  const toggleState = () => {
    if (onChange) {
      onChange(!value);
    }
  };

  if (size == "small") {
    return (
      <>
        <button
          type="button"
          className={clsx(
            "group flex h-4 w-7 cursor-pointer items-center rounded-full px-1 transition-[transform,background] duration-300",
            value
              ? color
                ? `bg-${color}`
                : "bg-success"
              : "bg-secondary-active",
            className,
          )}
          onClick={toggleState}
        >
          <div
            className={clsx(
              "h-2.5 w-2.5 transform rounded-full bg-bg duration-300 ease-in-out",
              value ? "translate-x-2.5 transform" : null,
            )}
          ></div>
        </button>
      </>
    );
  } else {
    return (
      <>
        <button
          type="button"
          className={clsx(
            "group flex h-6 w-10 cursor-pointer items-center rounded-full px-1 transition-[transform,background] duration-300",
            value ? (color ? color : "bg-success") : "bg-secondary-active",
            className,
          )}
          onClick={toggleState}
        >
          <div
            className={clsx(
              "h-4 w-4 transform rounded-full bg-bg duration-300 ease-in-out",
              value ? "translate-x-4 transform" : "",
            )}
          ></div>
        </button>
      </>
    );
  }
}

export default Switch;
