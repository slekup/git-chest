"use client";

import React from "react";

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      type="text"
      {...props}
      className={`py-3 px-4 rounded-md bg-input focus:bg-input-focus border border-border hover:border-border-hover focus:border-border-focus w-full ${props.className || ""}`}
    ></input>
  );
};

export default Input;
