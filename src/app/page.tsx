"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

import { BsDatabaseCheck } from "react-icons/bs";
import {
  GoGitPullRequest,
  GoIssueOpened,
  GoRepoForked,
  GoStar,
} from "react-icons/go";
import { HiOutlineSearch } from "react-icons/hi";

import { Loader, Tooltip } from "@components/index";
import { addToast } from "@slices/toasts.slice";
import { ToastType } from "@typings/core";
import { durationSince } from "@utils/formatDate";

interface Repo {
  id: number;
  platform: string;
  repo: string;
  clone_data: boolean;
  updated_at: string;
  owner: {
    id: number;
    user: string;
    avatar: string;
  };
  description: string;
  stars: number;
  forks: number;
  issues: number;
  pull_requests: number;
  visibility: string;
}

export default function Home() {
  const [loading, setLoading] = useState<boolean>(true);
  const [repos, setRepos] = useState<Repo[]>([]);

  const onChange = (_: ChangeEvent<HTMLInputElement>) => {};

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
              <Loader />
            </div>
          </div>
        ) : repos.length > 0 ? (
          repos.map((repo, i) => (
            <div
              key={i}
              className={clsx(
                "flex justify-between py-2 px-3",
                i !== 0 && "border-t border-border",
              )}
            >
              <div className="relative flex">
                <div className="h-10 w-10">
                  <Image
                    src={convertFileSrc(repo.owner.avatar)}
                    width={30}
                    height={30}
                    alt={`${repo.owner.user} avatar`}
                    className="h-10 w-10 absolute top-1/2 -translate-y-1/2 rounded-full object-contain"
                  />
                </div>
                <div className="ml-4">
                  <div className="flex mt-0.5">
                    <div className="flex relative text-xl">
                      <Image
                        src={`/${repo.platform}.svg`}
                        width={18}
                        height={18}
                        alt={`${repo.platform} logo`}
                        className="mt-0.5 mr-1.5 rounded-lg"
                      />
                      <Link
                        href={`/user?username=${repo.owner.user}`}
                        className="text-link hover:underline"
                      >
                        {repo.owner.user}
                      </Link>
                      <span className="text-fg-tertiary mx-1">/</span>
                      <Link
                        href={`/repo?id=${repo.id}`}
                        className="font-bold text-link hover:underline"
                      >
                        {repo.repo}
                      </Link>
                    </div>
                    <div className="mt-1 -mb-0.5 h-6 ml-2 text-xs py-0.5 px-1.5 rounded-full bg-bg text-fg-tertiary font-medium border border-border capitalize">
                      {repo.visibility}
                    </div>
                    {repo.clone_data && (
                      <div className="ml-1.5 my-1 translate-y-px">
                        <Tooltip text="Data Cloned" offset={20}>
                          <BsDatabaseCheck className="h-5 w-5 text-purple-500" />
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  <p className="text-sm -mt-0.5 text-fg-tertiary">
                    {repo.description}
                  </p>
                </div>
              </div>
              <div className="pt-1">
                <div className="text-fg-tertiary text-sm">
                  Last Synced: {durationSince(repo.updated_at)} ago
                </div>
                <div className="mt-1 flex justify-end text-sm text-fg-tertiary">
                  <Link
                    href={`/repo/stars?id=${repo.id}`}
                    className="flex hover:text-link"
                  >
                    <GoStar className="h-4 w-4 mt-[3px] mr-0.5" /> {repo.stars}
                  </Link>
                  <Link
                    href={`/repo/stars?id=${repo.id}`}
                    className="flex ml-2 hover:text-link"
                  >
                    <GoRepoForked className="h-4 w-4 mt-[3px] mr-0.5" />{" "}
                    {repo.forks}
                  </Link>
                  <Link
                    href={`/repo/stars?id=${repo.id}`}
                    className="flex ml-2 hover:text-link"
                  >
                    <GoIssueOpened className="h-4 w-4 mt-[3px] mr-0.5" />{" "}
                    {repo.issues}
                  </Link>
                  <Link
                    href={`/repo/stars?id=${repo.id}`}
                    className="flex ml-2 hover:text-link"
                  >
                    <GoGitPullRequest className="h-4 w-4 mt-[3px] mr-0.5" />{" "}
                    {repo.pull_requests}
                  </Link>
                </div>
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
