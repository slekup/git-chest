import React from "react";

interface Props {
  text: string;
}

const Label = ({ text }: Props) => {
  return <label className="text-sm text-fg-tertiary">{text}:</label>;
};

export default Label;
