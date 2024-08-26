import clsx from "clsx";
import React from "react";

interface Props {
  children: React.ReactNode;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Modal = ({ children, open, setOpen }: Props) => {
  return (
    <>
      <div
        className={clsx(
          "z-50 bg-black/40 backdrop-blur-md fixed top-0 left-0 h-full w-full transition-[opacity,visibility] duration-300",
          !open && "invisible opacity-0",
        )}
        onClick={() => setOpen(false)}
      ></div>

      <div
        className={clsx(
          "z-50 max-h-96 fixed w-full max-w-xl bg-bg-modal rounded-lg border border-border top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 transition-[visibility,opacity,transform,background] duration-300",
          !open && "invisible opacity-0 scale-75",
        )}
        onKeyDown={(e) => {
          if (open && e.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        {children}
      </div>
    </>
  );
};

export default Modal;
