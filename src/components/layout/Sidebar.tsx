import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Image from "next/image";
import clsx from "clsx";

import { IconType } from "react-icons";
import {
  HiGlobe,
  HiOutlineCloud,
  HiOutlineGlobe,
  HiOutlineGlobeAlt,
} from "react-icons/hi";
import {
  HiEye,
  HiFolderOpen,
  HiHeart,
  HiMiniMagnifyingGlass,
  HiOutlineEye,
  HiOutlineFolderOpen,
  HiOutlineHeart,
  HiPlus,
} from "react-icons/hi2";

import Tooltip from "@components/global/Tooltip/Tooltip";
import {
  RiArchive2Fill,
  RiArchive2Line,
  RiCompass3Fill,
  RiCompass3Line,
  RiEyeFill,
  RiEyeLine,
  RiHeart3Fill,
  RiHeart3Line,
} from "react-icons/ri";
import { PiTreasureChestBold } from "react-icons/pi";

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
    icon: RiArchive2Line,
    activeIcon: RiArchive2Fill,
    href: "/",
  },
  {
    title: "Favorites",
    icon: RiHeart3Line,
    activeIcon: RiHeart3Fill,
    activeClass: "text-rose-500",
    href: "/favorites",
  },
  {
    title: "Watching",
    icon: RiEyeLine,
    activeIcon: RiEyeFill,
    activeClass: "text-lime-500",
    href: "/watching",
  },

  {
    title: "Explore",
    icon: RiCompass3Line,
    activeIcon: RiCompass3Fill,
    activeClass: "text-cyan-400",
    href: "/explore",
  },
];

const SidebarButton = ({
  title,
  icon: Icon,
  activeIcon: ActiveIcon,
  activeClass,
  href,
  baseUrl,
}: {
  title: string;
  icon: IconType;
  activeIcon: IconType;
  activeClass?: string;
  href?: string;
  baseUrl: string;
}) => {
  const btnClass = `block p-2 rounded-md ${baseUrl == href ? "bg-secondary-hover active:bg-secondary-active " + activeClass : "text-fg-tertiary hover:text-fg active:text-fg hover:bg-secondary active:bg-secondary-hover"}`;

  return (
    <>
      <div className="pb-2">
        <Tooltip text={title} direction="right" offset={15}>
          {href ? (
            <Link href={href} className={btnClass}>
              {baseUrl === href ? (
                <ActiveIcon className="h-6 w-6" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
            </Link>
          ) : (
            <button type="button" className={btnClass}>
              {" "}
              {baseUrl === href ? (
                <ActiveIcon className="h-6 w-6" />
              ) : (
                <Icon className="h-6 w-6" />
              )}
            </button>
          )}
        </Tooltip>
      </div>
    </>
  );
};

const Sidebar = () => {
  const pathname = usePathname();
  const baseUrl = "/" + pathname.split("/")[1];

  return (
    <>
      <div className="relative min-w-14"></div>
      <div className="absolute top-0 left-0 bottom-0 h-full min-w-14 max-w-14 bg-bg-sidebar border-r border-border">
        <div className="m-2 p-1 w-10 h-10 rounded-md">
          <Image src="/logo.svg" width={40} height={40} alt="Logo" />
        </div>

        <div className="my-2 mx-2 h-px bg-border"></div>

        <div className="p-2 mt-2">
          {links.map((l, i) => (
            <SidebarButton
              key={i}
              title={l.title}
              icon={l.icon}
              activeIcon={l.activeIcon}
              activeClass={l.activeClass}
              href={l.href}
              baseUrl={baseUrl}
            />
          ))}

          <div className="mb-4 mt-2 h-px w-full bg-border"></div>

          <div className="pb-2">
            <Tooltip text="Add Repository" direction="right" offset={15}>
              <Link
                type="button"
                className={clsx(
                  "block p-2 rounded-md",
                  baseUrl === "/add"
                    ? "scale-90 bg-primary-active shadow-[0_0_5px_2px_rgba(var(--primary-active))]"
                    : "text-primary-fg bg-primary hover:bg-primary-hover active:bg-primary-active",
                )}
                href="/add"
              >
                <HiPlus className="h-6 w-6" />
              </Link>
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
