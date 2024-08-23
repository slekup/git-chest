import React, { useCallback, useEffect, useState } from "react";

import { MdClose, MdError, MdInfo } from "react-icons/md";

import { Toast as ToastInterface, ToastType } from "@typings/core";
import { HiCheckCircle } from "react-icons/hi";
import { IoWarning } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { removeToast, resetTime } from "@slices/toasts.slice";

const typeBorder = {
  [ToastType.Info]: "border-primary/20",
  [ToastType.Success]: "border-success/20",
  [ToastType.Warning]: "border-warning/20",
  [ToastType.Error]: "border-danger/20",
};

const typeBackground = {
  [ToastType.Info]: "bg-primary/10",
  [ToastType.Success]: "bg-success/10",
  [ToastType.Warning]: "bg-warning/10",
  [ToastType.Error]: "bg-danger/10",
};

const typeBackgroundFull = {
  [ToastType.Info]: "bg-primary",
  [ToastType.Success]: "bg-success",
  [ToastType.Warning]: "bg-warning",
  [ToastType.Error]: "bg-danger",
};

const typeIcon = {
  [ToastType.Info]: <MdInfo className="h-6 w-6 text-primary" />,
  [ToastType.Success]: <HiCheckCircle className="h-6 w-6 text-success" />,
  [ToastType.Warning]: <IoWarning className="h-6 w-6 text-warning" />,
  [ToastType.Error]: <MdError className="h-6 w-6 text-danger" />,
};

interface Props {
  toast: ToastInterface;
}

const Toast = ({ toast }: Props) => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState<boolean>(true);
  const [animationKey, setAnimationKey] = useState(Date.now());

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => dispatch(removeToast(toast.id as string)), 500);
  }, [dispatch, toast]);

  useEffect(() => {
    setAnimationKey(Date.now());
    const timer = setTimeout(
      () => {
        handleClose();
      },
      toast.time ?? 1000 * 60,
    );

    return () => clearTimeout(timer);
  }, [handleClose, toast]);

  return (
    <div
      className={`relative overflow-hidden grid max-w-80 rounded-lg border-border bg-bg shadow-lg transition-all duration-500 ${
        visible
          ? `mb-2 animate-[toast-enter_300ms_ease] grid-rows-[1fr] border ${typeBorder[toast.type]}`
          : "translate-x-full grid-rows-[0fr] opacity-0"
      }`}
      onMouseOver={() => {
        dispatch(resetTime(toast.id as string));
      }}
    >
      <div
        className={`absolute h-0.5 w-full origin-right ${typeBackgroundFull[toast.type]}`}
        key={animationKey}
        style={{
          animationDuration: `${toast.time}ms`,
          animationName: "toast-time-progress",
        }}
      ></div>
      <div
        className="overflow-hidden transition-all duration-500"
        id={toast.id}
      >
        <div
          className={`flex h-10 justify-between border-b p-1 ${typeBorder[toast.type]}`}
        >
          <div className="flex p-1">
            <div className="mr-1">{typeIcon[toast.type]}</div>
            <p className="my-0.5 text-sm font-bold text-fg">{toast.title}</p>
          </div>

          <button
            className="rounded-3xl p-1.5 text-fg-tertiary hover:bg-bg-secondary active:bg-bg-tertiary transition"
            onClick={handleClose}
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        {toast.description && (
          <div className={`px-4 pb-4 pt-3 ${typeBackground[toast.type]}`}>
            <div className="mt-0.5 text-sm leading-4 text-fg-secondary">
              {toast.description.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
