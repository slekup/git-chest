import React from "react";

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      {...props}
      className="mt-1 py-3 px-4 rounded-lg bg-input focus:bg-input-focus border-2 border-border hover:border-border-hover focus:border-border-focus font-semibold text-2xl w-full resize-none"
    ></textarea>
  );
};

export default TextArea;
