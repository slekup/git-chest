"use client";

import clsx from "clsx";
import React, { Ref } from "react";
import { FieldError } from "react-hook-form";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: FieldError;
}

const Input = (props: Props, _: Ref<HTMLInputElement>) => {
  return (
    <>
      <input
        type="text"
        aria-invalid={props.error ? true : false}
        {...props}
        className={clsx(
          "py-3 px-4 rounded-md bg-input focus:bg-input-focus border w-full placeholder:text-fg-tertiary/50",
          props.error
            ? "border-danger"
            : "border-border hover:border-border-hover focus:border-border-focus",
          props.className || "",
        )}
        ref={_}
      ></input>
      {props.error && (
        <span className="block mt-1 text-sm text-danger">
          {props.error.type === "required"
            ? "This field is required"
            : props.error.message && props.error.message.length > 0
              ? props.error.message
              : "This field is invalid."}
        </span>
      )}
    </>
  );
};

export default React.forwardRef(Input);
