import { useSelector } from "react-redux";

import { toastsState } from "@slices/toasts.slice";
import Toast from "./Toast";

const Toasts = () => {
  const toasts = useSelector(toastsState);

  return (
    <>
      <div className="fixed top-4 right-4 h-full z-40">
        {toasts.map((toast) => (
          <Toast toast={toast} key={toast.id} />
        ))}
      </div>
    </>
  );
};

export default Toasts;
