"use client";

import React, { useState } from "react";
import ReactDOM from "react-dom";

import { HiChevronDown } from "react-icons/hi";

import { BsCheckCircleFill } from "react-icons/bs";

export interface SelectOption<T> {
  label: string;
  value: T;
}

interface Props<T> {
  options: SelectOption<T>[];
  value?: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

const Select = <T,>({ options, value, disabled, onChange }: Props<T>) => {
  const [focused, setFocused] = useState<boolean>(false);

  const [width, setWidth] = useState<number>(0);
  const [fromTop, setFromTop] = useState<number>(0);
  const [fromLeft, setFromLeft] = useState<number>(0);

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
    <div
      className={`max-h-16 w-full overflow-visible ${focused ? "z-[100]" : "z-50"}`}
      onScroll={(_) => handleScroll()}
    >
      <button
        type="button"
        className={`flex h-12 max-h-12 w-full cursor-pointer justify-between rounded-lg border border-border py-3 pl-4 pr-3 font-semibold ring-primary/30 transition ${
          disabled
            ? "cursor-default"
            : "btn-default focus:border focus:border-primary focus:bg-bg-secondary focus:ring"
        }`}
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
        id={`${focused ? "select-btn-true" : "select-btn-false"}`}
      >
        {value !== undefined
          ? options.find((o) => o?.value === value)?.label
          : "Select from dropdown2"}
        <HiChevronDown
          className={`pointer-events-none h-5 w-5 transition duration-200 ${focused && "rotate-180"}`}
        />
      </button>

      {document.body &&
        ReactDOM.createPortal(
          <>
            <div
              className={`fixed left-0 top-0 z-[90] h-full w-full ${!focused && "hidden"}`}
              onClick={() => setFocused(false)}
            ></div>

            <div
              className="no-select fixed z-[100]"
              style={{ top: fromTop, left: fromLeft, width: width }}
              id="select-dropdown"
            >
              <div
                className={`thin-scroll top-0 z-[100] max-h-60 origin-top cursor-default overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-bg p-1 transition-all duration-200 ${
                  focused ? "" : "invisible h-0 -translate-y-3 opacity-0"
                }`}
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
  );
};

interface OptionProps<T> {
  option: SelectOption<T>;
  index: number;
  value?: T;
  onChange: (value: T) => void;
  setFocused: (value: React.SetStateAction<boolean>) => void;
}

const Option = <T,>({
  option,
  index,
  value,
  onChange,
  setFocused,
}: OptionProps<T>) => {
  return (
    <button
      type="button"
      onClick={() => {
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
          onChange(option.value);
          setFocused(false);
        }
      }}
      className={`py-2 px-3 hover:bg-secondary active:bg-secondary-hover transition rounded-lg flex h-10 w-full justify-between text-left ring-inset ${
        value === option.value && "bg-bg-secondary font-semibold"
      }`}
      id={`select-dropdown-item-${index.toString()}`}
    >
      {option.label}
      {value === option.value && (
        <BsCheckCircleFill className="mt-0.5 h-4 w-4 text-fg-tertiary" />
      )}
    </button>
  );
};

export default Select;
