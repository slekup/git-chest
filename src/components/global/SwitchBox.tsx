import { Switch } from "@components";

interface Props {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

const SwitchBox = ({ title, value, onChange, className }: Props) => {
  const toggleState = () => {
    onChange(!value);
  };

  return (
    <div
      className={`text-fg-secondary transition hover:bg-secondary active:bg-secondary-hover flex w-full justify-between rounded-lg border border-border hover:border-border-hover active:border-border-active px-4 py-3 ${
        className && className
      }`}
      onClick={toggleState}
    >
      <h3 className="font-semibold">{title}</h3>
      <div>
        <Switch value={value} />
      </div>
    </div>
  );
};

export default SwitchBox;
