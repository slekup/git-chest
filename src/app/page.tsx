"use client";

import { Tooltip } from "@components/index";
import { addToast } from "@slices/toasts.slice";
import { invoke } from "@tauri-apps/api/core";
import { ToastType } from "@typings/core";
import { durationSince, formatDate } from "@utils/formatDate";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { AiOutlineLoading, AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsDatabaseCheck } from "react-icons/bs";
import { HiOutlineSearch } from "react-icons/hi";
import { RiLoader2Fill, RiLoaderFill } from "react-icons/ri";
import { useDispatch } from "react-redux";

interface Repo {
  id: number;
  platform: string;
  user: string;
  repo: string;
  clone_data: boolean;
  auto_sync: boolean;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [repos, setRepos] = useState<Repo[]>([]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {};

  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);

    invoke<Repo[]>("get_repo_list", {})
      .then((data) => {
        setRepos(data);
        setLoading(false);
      })
      .catch((err: string) => {
        setLoading(false);
        dispatch(
          addToast({
            title: "Failed to get repo list.",
            description: err,
            type: ToastType.Error,
          }),
        );
      });
  }, [dispatch]);

  return (
    <main className="max-w-3xl mx-auto my-20 p-5">
      <div className="relative">
        <HiOutlineSearch className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-fg-tertiary/50 pointer-events-none" />
        <input
          className="w-full py-5 pl-14 pr-8 text-lg rounded-md bg-input hover:bg-input-hover focus:bg-input-focus border border-border hover:border-border-hover active:border-border-active focus:border-border-focus placeholder:text-fg-tertiary"
          placeholder="Search your local directory..."
          onChange={onChange}
        />
      </div>
      <div className="my-10 h-px bg-border"></div>
      <div className="p-2 rounded-md bg-bg-secondary border border-border">
        {loading ? (
          <div className="relative h-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <RiLoaderFill className="h-8 w-8 text-fg-tertiary animate-loader" />
            </div>
          </div>
        ) : repos.length > 0 ? (
          repos.map((repo, i) => (
            <div
              key={i}
              className={clsx(
                "flex justify-between p-2",
                i !== 0 && "border-t border-border",
              )}
            >
              <div className="flex">
                <Image
                  src={`/${repo.platform}.svg`}
                  width={30}
                  height={30}
                  alt={`${repo.platform} logo`}
                  className="rounded-lg"
                />
                <div className="ml-5">
                  <Link
                    href={`/repos/${repo.id}`}
                    className="block relative text-xl group"
                  >
                    <span>{repo.user}</span>
                    <span className="text-fg-tertiary mx-1">/</span>
                    <span className="font-bold">{repo.repo}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-px origin-left bg-gradient-to-r from-primary to-primary-active group-hover:w-full transition-[width] duration-100"></span>
                  </Link>

                  <p className="text-sm -mt-0.5 text-fg-tertiary">
                    description goes here..
                  </p>
                </div>
                <div className="ml-1.5 my-1 translate-y-px">
                  <Tooltip text="Data Cloned" offset={20}>
                    <BsDatabaseCheck className="h-5 w-5 text-purple-500" />
                  </Tooltip>
                </div>
              </div>
              <div className="flex pt-1">
                <p className="text-fg-tertiary text-sm">
                  Last Synced: {durationSince(repo.updated_at)} ago
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-fg-tertiary p-2 text-center">
            No repositories saved yet.
          </p>
        )}
      </div>
    </main>
  );
}
