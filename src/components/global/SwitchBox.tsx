import { Switch } from "@components";
import clsx from "clsx";

interface Props {
  title: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

const SwitchBox = ({
  title,
  description,
  value,
  onChange,
  className,
}: Props) => {
  const toggleState = () => {
    onChange(!value);
  };

  return (
    <div
      className={clsx("flex justify-between cursor-pointer w-full", className)}
      onClick={toggleState}
    >
      <div className="w-full">
        <h3 className="font-semibold text-fg">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-fg-tertiary">
            {description.split("\\n").map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        )}
      </div>
      <div className="relative w-10 ml-12">
        <div className="absolute top-1/2 -translate-y-1/2">
          <Switch value={value} />
        </div>
      </div>
    </div>
  );
};

export default SwitchBox;
