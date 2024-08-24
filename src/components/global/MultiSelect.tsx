import React, { useState } from "react";
import ReactDOM from "react-dom";

import { HiChevronDown } from "react-icons/hi";
import {
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
} from "react-icons/ri";

export interface MultiSelectOption<T> {
  label: React.ReactElement | string;
  value: T;
}

interface Props<T> {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  title?: string;
  disabled?: boolean;
}

const MultiSelect = <T,>({
  options,
  value,
  onChange,
  title,
  disabled,
}: Props<T>) => {
  const [focused, setFocused] = useState(false);

  const [width, setWidth] = useState<number>(0);
  const [fromTop, setFromTop] = useState<number>(0);
  const [fromLeft, setFromLeft] = useState<number>(0);

  const handleSelect = (selectedValue: T) => {
    if (value?.includes(selectedValue)) {
      onChange(value.filter((item) => item !== selectedValue));
    } else {
      onChange([...(value || []), selectedValue]);
    }
  };

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
      className={`w-full ${focused ? "z-[100]" : "z-50"}`}
      onScroll={handleScroll}
    >
      <button
        type="button"
        className={`text-fg-secondary flex h-12 max-h-12 w-full justify-between rounded-md border border-border hover:border-border-hover active:border-border-active py-3 pl-4 pr-3 ${
          disabled
            ? "cursor-default opacity/50"
            : "cursor-pointer btn-default focus:border focus:border-primary bg-input focus:bg-input-focus"
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
        id={focused ? "select-btn-true" : ""}
      >
        <p>{title || "Select from Dropdown"}</p>
        <HiChevronDown
          className={`h-5 w-5 transition duration-200 ${focused && "rotate-180"}`}
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
                className={`thin-scroll top-0 z-[100] max-h-60 origin-top cursor-default overflow-y-auto overflow-x-hidden rounded-md border border-border bg-bg px-2 py-1 transition duration-300 ${
                  focused ? "" : "invisible h-0 -translate-y-3 opacity-0"
                }`}
              >
                {options.map((option, index) => (
                  <Option
                    key={index}
                    index={index}
                    option={option}
                    value={value}
                    handleSelect={handleSelect}
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
  option: MultiSelectOption<T>;
  index: number;
  value?: T[];
  handleSelect: (value: T) => void;
}

const Option = <T,>({ option, index, value, handleSelect }: OptionProps<T>) => {
  return (
    <button
      type="button"
      key={option.value as unknown as string}
      onClick={() => handleSelect(option.value)}
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
          handleSelect(option.value);
        }
      }}
      className={`p-3 my-1 rounded-md flex w-full text-left ${
        value?.includes(option.value)
          ? "bg-secondary-hover font-semibold"
          : "text-fg-secondary hover:bg-secondary active:bg-secondary-hover"
      }`}
      id={`select-dropdown-item-${index.toString()}`}
    >
      {value?.includes(option.value) ? (
        <RiCheckboxCircleFill className="mt-0.5 h-4 w-4 text-success" />
      ) : (
        <RiCheckboxBlankCircleLine className="mt-0.5 h-4 w-4 text-fg-tertiary" />
      )}
      <p className="text-sm pl-3">{option.label}</p>
    </button>
  );
};

export default MultiSelect;
