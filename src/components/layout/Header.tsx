import Tooltip from "@components/global/Tooltip/Tooltip";
import Image from "next/image";
import React from "react";
import { HiDotsVertical } from "react-icons/hi";

const Header = () => {
  return (
    <>
      <div className="relative h-14 w-full"></div>
      <div className="fixed z-40 justify-between flex top-0 left-0 h-14 w-full border-b border-border bg-bg-tertiary/60 backdrop-blur-md">
        <div className="flex mt-1 ml-3">
          <Image
            src="/chest.svg"
            height={40}
            width={40}
            alt="Chest Graphic"
            className="-mt-0.5"
          />
          <p className="text-2xl font-bold ml-3 mt-1.5 translate-y-px">
            Git Chest
          </p>
        </div>
        <div className="m-2">
          <Tooltip text="Options" direction="left" delay={500}>
            <button className="p-2 rounded-md border border-transparent hover:border-border active:border-border hover:bg-secondary-hover active:bg-secondary-active text-secondary-fg hover:text-fg active:text-fg">
              <HiDotsVertical className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export default Header;
