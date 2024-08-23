"use client";

import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly size?: "sm" | "md" | "lg";
  readonly variant?:
    | "primary"
    | "secondary"
    | "secondary2"
    | "menu"
    | "menu-active"
    | "danger"
    | "warning"
    | "success";
  readonly width?: "auto" | "full";
  readonly link?: boolean;
}

const Button = ({
  label,
  size = "md",
  variant = "primary",
  width = "auto",
  link = false,
  ...props
}: ButtonProps): JSX.Element => {
  const sizeStyle = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-lg",
  };

  const variantStyle = {
    primary:
      "bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-fg border border-transparent",

    secondary:
      "bg-secondary hover:bg-secondary-hover active:bg-secondary-active text-secondary-fg border border-transparent",

    secondary2:
      "bg-secondary2 hover:bg-secondary2-hover active:bg-secondary2-active text-secondary2-fg border border-border hover:border-border-hover active:border-border-active",

    menu: "hover:bg-menu-hover active:bg-menu-active",
    "menu-active": "bg-menu text-menu-fg",

    danger:
      "bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-fg border border-transparent",

    warning:
      "bg-warning hover:bg-warning-hover active:bg-warning-active text-warning-fg border border-transparent",

    success:
      "bg-success hover:bg-success-hover active:bg-success-active text-success-fg border border-transparent",
  };

  return link ? (
    <p
      className={`rounded-md font-medium ${
        sizeStyle[size]
      } ${variantStyle[variant]} ${width === "full" && "w-full"} ${props.className}`}
      {...(props as React.HTMLAttributes<HTMLParagraphElement>)}
    >
      {label}
    </p>
  ) : (
    <button
      type="button"
      {...props}
      className={`rounded-md font-medium ${
        sizeStyle[size]
      } ${variantStyle[variant]} ${width === "full" ? "w-full" : ""} ${props.className}`}
    >
      {label}
    </button>
  );
};

export default Button;
