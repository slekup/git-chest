import React from "react";

interface Props {
  text: string;
}

const Label = ({ text }: Props) => {
  return (
    <label className="font-bold uppercase text-fg-secondary">{text}:</label>
  );
};

export default Label;
