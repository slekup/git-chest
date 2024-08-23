import React from "react";

/* interface SidebarLink {
  title: string;
  href: string;
} */

/* const links: SidebarLink[] = [
  {
    title: "Dashboard",
    href: "/",
  },
  {
    title: "Library",
    href: "/library",
  },
  {
    title: "Study",
    href: "/study",
  },
  {
    title: "Community",
    href: "/community",
  },
  {
    title: "Analysis",
    href: "/analysis",
  },
]; */

/* const SidebarButton = ({
  title,
  href,
}: {
  title: string;
  href: string | undefined;
}) => {
  const pathname = usePathname();
  const baseUrl = "/" + pathname.split("/")[1];

  const btn = (
    <button
      type="button"
      className={`text-left my-1 py-3 hover:px-5 active:px-5 rounded-lg font-bold block w-full transition-[background,padding,transform] active:scale-95 ${baseUrl == href ? "bg-menu hover:bg-primary-hover active:bg-primary-active text-menu-fg px-5" : "px-3 hover:bg-secondary active:bg-secondary-hover"}`}
    >
      {title}
    </button>
  );

  return href ? <Link href={href}>{btn}</Link> : btn;
}; */

const Sidebar = () => {
  // const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className=""></div>
      <div className=""></div>
    </>
  );
};

export default Sidebar;
