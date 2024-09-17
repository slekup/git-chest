"use client";

import clsx from "clsx";
import Link, { LinkProps } from "next/link";
import React from "react";
import { IconType } from "react-icons";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly size?: "sm" | "md" | "lg";
  readonly variant?:
    | "primary"
    | "primary-outline"
    | "secondary"
    | "secondary2"
    | "menu"
    | "menu-active"
    | "danger"
    | "danger-outline"
    | "warning"
    | "warning-outline"
    | "success"
    | "success-outline";
  readonly width?: "auto" | "full";
  readonly link?: boolean;
  readonly href?: string;
  readonly target?: string;
  readonly icon?: IconType;
}

const Button = ({
  label,
  size = "md",
  variant = "primary",
  width = "auto",
  href,
  icon: Icon,
  ...props
}: ButtonProps): JSX.Element => {
  const sizeStyle = {
    sm: "px-3 py-1.5 text-xs font-semibold",
    md: "px-5 py-2.5 text-sm font-medium",
    lg: "px-6 py-3.5 text-lg font-medium",
  };

  const iconSizeStyle = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const variantStyle = {
    primary:
      "bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-fg border border-transparent",
    "primary-outline":
      "bg-bg text-fg hover:text-fg active:text-fg border border-primary hover:border-transparent active:border-transparent hover:bg-primary active:bg-primary-active",

    secondary:
      "bg-secondary hover:bg-secondary-hover active:bg-secondary-active text-secondary-fg border border-transparent",

    secondary2:
      "bg-secondary2 hover:bg-secondary2-hover active:bg-secondary2-active text-secondary2-fg border border-border hover:border-border-hover active:border-border-active",

    menu: "hover:bg-menu-hover active:bg-menu-active",
    "menu-active": "bg-menu text-menu-fg",

    danger:
      "bg-danger hover:bg-danger-hover active:bg-danger-active text-danger-fg border border-transparent",
    "danger-outline":
      "bg-bg text-fg hover:text-fg active:text-fg border border-danger-active hover:border-transparent active:border-transparent hover:bg-danger active:bg-danger-active",

    warning:
      "bg-warning hover:bg-warning-hover active:bg-warning-active text-warning-fg border border-transparent",
    "warning-outline":
      "bg-bg text-fg hover:text-fg active:text-fg border border-warning-active hover:border-transparent active:border-transparent hover:bg-warning active:bg-warning-active",

    success:
      "bg-success hover:bg-success-hover active:bg-success-active text-success-fg border border-transparent",
    "success-outline":
      "bg-bg text-fg hover:text-fg active:text-fg border border-success hover:border-transparent active:border-transparent hover:bg-success active:bg-success-active",
  };

  return href ? (
    <Link
      {...(props as LinkProps)}
      className={clsx(
        "inline-block rounded-md text-center",
        sizeStyle[size],
        variantStyle[variant],
        width === "full" ? "w-full" : "",
        props.className,
      )}
      href={href}
    >
      {Icon && (
        <Icon className={clsx("inline -mt-0.5 mr-1.5", iconSizeStyle[size])} />
      )}
      {label}
    </Link>
  ) : (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-block rounded-md text-center",
        sizeStyle[size],
        variantStyle[variant],
        width === "full" ? "w-full" : "",
        props.className,
      )}
    >
      {Icon && (
        <Icon className={clsx("inline -mt-0.5 mr-1.5", iconSizeStyle[size])} />
      )}
      {label}
    </button>
  );
};

export default Button;
