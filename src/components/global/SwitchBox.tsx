import { Switch } from "@components";

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
      className={`flex cursor-pointer w-full ${className && className}`}
      onClick={toggleState}
    >
      <div className="w-1/2">
        <h3 className="font-semibold text-fg">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-fg-tertiary">
            {description.split("\\n").map((part, i) => (
              <p key={i}>{part}</p>
            ))}
          </p>
        )}
      </div>
      <div className="relative w-1/2 pl-10">
        <div className="absolute top-1/2 -translate-y-1/2">
          <Switch value={value} />
        </div>
      </div>
    </div>
  );
};

export default SwitchBox;
