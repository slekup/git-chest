"use client";

import { ChangeEvent } from "react";
import { HiOutlineSearch } from "react-icons/hi";

export default function Home() {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {};

  return (
    <main className="max-w-3xl mx-auto my-20">
      <div className="relative">
        <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-fg-tertiary/50" />
        <input
          className="w-full py-5 pl-14 pr-8 text-lg rounded-md bg-input hover:bg-input-hover focus:bg-input-focus border border-border hover:border-border-hover focus:border-primary placeholder:text-fg-tertiary"
          placeholder="Search your local directory..."
          onChange={onChange}
        />
      </div>
      <div className="my-10 h-px bg-border"></div>
      <div className="p-5 rounded-md bg-bg-secondary border border-border">
        <p className="text-fg-tertiary">No repositories saved yet.</p>
      </div>
    </main>
  );
}
