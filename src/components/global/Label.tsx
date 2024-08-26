import clsx from "clsx";
import React from "react";
import { IconType } from "react-icons";

interface Badge {
  text: string;
  icon: IconType;
  variant?: "primary" | "secondary" | "danger" | "warning" | "success";
}

interface Props extends React.LabelHTMLAttributes<HTMLLabelElement> {
  text: string;
  badge?: Badge;
}

const colors = {
  primary: "text-primary-active bg-primary/30",
  secondary: "text-fg-tertiary bg-secondary",
  danger: "text-danger bg-danger/20",
  warning: "text-warning bg-warning/20",
  success: "text-success bg-success/20",
};

const Label = ({ text, badge, ...props }: Props) => {
  return (
    <label
      {...props}
      className={clsx("flex text-sm text-fg-tertiary", props.className ?? "")}
    >
      <span>{text}:</span>
      {badge && (
        <span
          className={clsx(
            `inline-flex ml-0.5 mb-1 pt-0.5 pl-1 pr-1.5 text-xs rounded-md font-semibold`,
            colors[badge.variant ?? "primary"],
          )}
        >
          {badge.icon && <badge.icon className="h-4 w-4 mt- mr-0.5" />}
          {badge.text}
        </span>
      )}
    </label>
  );
};

export default Label;
