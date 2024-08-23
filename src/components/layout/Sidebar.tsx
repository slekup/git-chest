import Tooltip from "@components/global/Tooltip/Tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { IconType } from "react-icons";
import {
  HiEye,
  HiFolderOpen,
  HiHeart,
  HiOutlineEye,
  HiOutlineFolderOpen,
  HiOutlineHeart,
  HiPlus,
} from "react-icons/hi2";

interface SidebarLink {
  title: string;
  icon: IconType;
  activeIcon: IconType;
  activeClass?: string;
  href: string;
}

const links: SidebarLink[] = [
  {
    title: "Directory",
    icon: HiOutlineFolderOpen,
    activeIcon: HiFolderOpen,
    href: "/",
  },
  {
    title: "Favorites",
    icon: HiOutlineHeart,
    activeIcon: HiHeart,
    activeClass: "text-rose-500",
    href: "/favorites",
  },
  {
    title: "Watching",
    icon: HiOutlineEye,
    activeIcon: HiEye,
    activeClass: "text-lime-500",
    href: "/watching",
  },
];

const SidebarButton = ({
  title,
  icon: Icon,
  activeIcon: ActiveIcon,
  activeClass,
  href,
}: {
  title: string;
  icon: IconType;
  activeIcon: IconType;
  activeClass: string;
  href: string | undefined;
}) => {
  const pathname = usePathname();
  const baseUrl = "/" + pathname.split("/")[1];

  const btn = (
    <div className="pb-2">
      <Tooltip text={title} direction="right" offset={15}>
        <button
          type="button"
          className={`p-2 rounded-md ${baseUrl == href ? "bg-secondary-hover active:bg-secondary-active " + activeClass : "text-fg-tertiary hover:text-fg active:text-fg hover:bg-secondary active:bg-secondary-hover"}`}
        >
          {baseUrl === href ? (
            <ActiveIcon className="h-6 w-6" />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </button>
      </Tooltip>
    </div>
  );

  return href ? <Link href={href}>{btn}</Link> : btn;
};

const Sidebar = () => {
  return (
    <>
      <div className="relative min-w-14"></div>
      <div className="absolute top-0 left-0 bottom-0 h-full min-w-14 max-w-14 bg-bg-sidebar border-r border-border">
        <div className="p-2 mt-2">
          {links.map((l, i) => (
            <SidebarButton
              key={i}
              title={l.title}
              icon={l.icon}
              activeIcon={l.activeIcon}
              activeClass={l.activeClass}
              href={l.href}
            />
          ))}
          <div className="mb-4 mt-2 h-px w-full bg-border-hover"></div>
          <div className="pb-2">
            <Tooltip text="Add Repository" direction="right" offset={15}>
              <button
                type="button"
                className="p-2 rounded-md text-primary-fg bg-primary hover:bg-primary-hover active:bg-primary-active"
              >
                <HiPlus className="h-6 w-6" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/** 
      <div className="relative min-w-60"></div>
      <div className="absolute top-0 left-14 bottom-0 h-full min-w-60 max-w-60 bg-bg-secondary border-r border-border"></div>
      */}
    </>
  );
};

export default Sidebar;
