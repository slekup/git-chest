"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { IconType } from "react-icons";
import { HiChevronDown } from "react-icons/hi";
import { BsCheckCircleFill } from "react-icons/bs";
import clsx from "clsx";

export interface SelectOption<T> {
  icon?: IconType;
  label: React.ReactElement | string;
  value: T;
  disabled?: boolean;
}

interface Props<T> {
  options: SelectOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  title?: string;
  disabled?: boolean;
}

const Select = <T,>({
  options,
  value,
  onChange,
  title,
  disabled,
}: Props<T>) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  const [width, setWidth] = useState<number>(0);
  const [fromTop, setFromTop] = useState<number>(0);
  const [fromLeft, setFromLeft] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSelect = (
    e:
      | React.MouseEvent<EventTarget>
      | React.FocusEvent<HTMLButtonElement | Element>,
    value?: boolean,
  ) => {
    if (disabled) return;
    setFocused(value ? value : !focused);
    const target = e.target as Element;
    const rect = target.getBoundingClientRect();

    const docElem = document.body;

    const scrollTop = docElem.scrollTop;
    const scrollLeft = docElem.scrollLeft;
    const top = rect.top + scrollTop - 0;
    const left = rect.left + scrollLeft - 0;

    setWidth(rect.width);
    setFromTop(Math.round(top) + 50);
    setFromLeft(Math.round(left));
  };

  const handleScroll = () => {
    if (focused === true) setFocused(false);
  };

  let tabKey = false;

  return (
    <>
      <div
        className={clsx("w-full", focused ? "z-[100]" : "z-50")}
        onScroll={handleScroll}
      >
        <button
          type="button"
          className={clsx(
            "text-fg-secondary flex h-12 max-h-12 w-full justify-between rounded-md border border-border hover:border-border-hover active:border-border-active py-3 pl-4 pr-3",
            disabled
              ? "cursor-default opacity/50"
              : "cursor-pointer btn-default focus:border focus:border-primary bg-input focus:bg-input-focus",
            focused ? "border-primary" : "",
          )}
          onClick={(e) => toggleSelect(e)}
          onFocus={(e) => toggleSelect(e, true)}
          onKeyDown={(e) => {
            if (focused && e.key === "ArrowDown") {
              e.preventDefault();
              document.getElementById("select-dropdown-item-0")?.focus();
            }

            if (e.key === "Tab") tabKey = true;
          }}
          onBlur={(_) => {
            if (tabKey) setFocused(false);
            tabKey = false;
          }}
          id={focused ? "select-btn-true" : ""}
        >
          <span className="flex">
            {value !== undefined &&
              ((option) =>
                option?.icon && (
                  <option.icon className="h-5 w-5 mr-2 my-0.5 text-fg-tertiary" />
                ))(options.find((o) => o?.value === value))}
            {value !== undefined
              ? options.find((o) => o?.value === value)?.label
              : title || "Select from dropdown"}
          </span>
          <HiChevronDown
            className={clsx(
              "pointer-events-none h-5 w-5 transition duration-200",
              focused && "rotate-180",
            )}
          />
        </button>

        {mounted &&
          ReactDOM.createPortal(
            <>
              <div
                className={clsx(
                  "fixed left-0 top-0 z-[90] h-full w-full",
                  !focused && "hidden",
                )}
                onClick={() => setFocused(false)}
              ></div>

              <div
                className="no-select fixed z-[100]"
                style={{ top: fromTop, left: fromLeft, width: width }}
                id="select-dropdown"
              >
                <div
                  className={clsx(
                    "thin-scroll top-0 z-[100] max-h-60 origin-top cursor-default overflow-y-auto overflow-x-hidden rounded-md border border-border bg-bg px-2 py-1 transition duration-300",
                    focused ? "" : "invisible h-0 -translate-y-3 opacity-0",
                  )}
                >
                  {options.map((option, index) => (
                    <Option
                      key={index}
                      index={index}
                      option={option}
                      value={value}
                      onChange={onChange}
                      setFocused={setFocused}
                    />
                  ))}
                </div>
              </div>
            </>,
            document.body,
          )}
      </div>
    </>
  );
};

interface OptionProps<T> {
  option: SelectOption<T>;
  value?: T;
  onChange: (value: T) => void;
  index: number;
  setFocused: (value: React.SetStateAction<boolean>) => void;
}

const Option = <T,>({
  option,
  value,
  onChange,
  index,
  setFocused,
}: OptionProps<T>) => {
  return (
    <button
      type="button"
      onClick={() => {
        if (option.disabled) return;
        onChange(option.value);
        setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          let prevItem = document.getElementById(
            `select-dropdown-item-${index - 1}`,
          );
          if (index === 0)
            prevItem = document.getElementById("select-btn-true");
          if (prevItem) prevItem.focus();
          return;
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          let nextItem = document.getElementById(
            `select-dropdown-item-${index + 1}`,
          );
          if (nextItem) nextItem.focus();
          return;
        }

        if (e.key === "Enter") {
          if (option.disabled) return;
          onChange(option.value);
          setFocused(false);
        }
      }}
      className={clsx(
        "p-3 my-1 rounded-md flex w-full justify-between text-left",
        value === option.value
          ? "bg-secondary-hover font-semibold"
          : !option.disabled
            ? "hover:bg-secondary active:bg-secondary-hover"
            : "",
        option.disabled ? "opacity-40 cursor-default" : "",
      )}
      id={`select-dropdown-item-${index.toString()}`}
    >
      <span className="flex">
        {option.icon && (
          <option.icon className="h-5 w-5 mr-2 my-0.5 text-fg-tertiary" />
        )}
        <span className="text-sm">{option.label}</span>
      </span>
      {value === option.value && (
        <BsCheckCircleFill className="mt-0.5 h-4 w-4 text-fg" />
      )}
    </button>
  );
};

export default Select;
