"use client";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import clsx from "clsx";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { IconType } from "react-icons";
import {
  GoBook,
  GoCode,
  GoCommentDiscussion,
  GoEye,
  GoFile,
  GoFileDirectoryFill,
  GoGitPullRequest,
  GoGraph,
  GoIssueOpened,
  GoLaw,
  GoLink,
  GoNote,
  GoPlay,
  GoProject,
  GoPulse,
  GoRepo,
  GoRepoForked,
  GoShield,
  GoStar,
} from "react-icons/go";

import { Button } from "@components/index";
import { Platform } from "@typings/platform";
import { addToast } from "@slices/toasts.slice";
import { ToastType } from "@typings/core";

import "@styles/markdown.css";

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

interface GitHubRepo {
  repo: {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
    description: string;
    fork: boolean;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    homepage?: string;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string;
    has_issues: boolean;
    has_projects: boolean;
    has_downloads: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_discussions: boolean;
    forks_count: number;
    archived: boolean;
    disabled: boolean;
    open_issues_count: number;
    allow_forking: boolean;
    is_template: boolean;
    web_commit_signoff_required: boolean;
    visibility: string;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    network_count: number;
    subscribers_count: number;
  };
  owner: {
    login: string;
    id: number;
    node_id: string;
    gravatar_id: string;
    type: string;
    site_admin: boolean;
  };
  org: {
    login: string;
    id: number;
    node_id: string;
    gravatar_id: string;
    type: string;
    site_admin: boolean;
  };
  topics: string[];
  license: {
    key: string;
    name: string;
    spdx_id: string;
    node_id: string;
  };
  custom_properties: { key: string; value: string }[];
}

interface PlatformRepo {
  type: Platform;
  data: GitHubRepo;
}

interface RepoTree {
  sha: string;
  truncated: boolean;
}

interface RepoTreeItem {
  id: number;
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
}

interface FullRepo {
  repo: Repo;
  platform_repo: PlatformRepo;
  tree: RepoTree;
  tree_items: RepoTreeItem[];
  readme?: string;
}

enum Tab {
  Readme,
  License,
  Security,
}

export default function Page() {
  const [fullRepo, setFullRepo] = useState<FullRepo | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>(Tab.Readme);

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = params.get("id");
  const tree_id = params.get("tree_id");

  useEffect(() => {
    setError(undefined);

    if (typeof id !== "string") {
      return setError("id is not provided");
    }

    invoke<FullRepo>("get_repo", {
      id: parseInt(id),
      tree_id: tree_id ? parseInt(tree_id) : undefined,
    })
      .then((data) => {
        setFullRepo(data);
      })
      .catch((err: string) => {
        setError(err);
        console.error(err);
      });
  }, [id, tree_id]);

  const removeRepo = () => {
    if (typeof id !== "string" || !fullRepo) return;

    invoke("remove_repo", { id: parseInt(id) })
      .then(() => {
        dispatch(
          addToast({
            title: "Repository removed successfully",
            description: `Removed ${fullRepo.repo.user}/${fullRepo.repo.repo}.`,
            type: ToastType.Success,
          }),
        );
        router.push("/");
      })
      .catch((err) => {
        dispatch(
          addToast({
            title: "Failed to remove repository",
            description: `Failed to remove ${fullRepo.repo.user}/${fullRepo.repo.repo}.`,
            type: ToastType.Error,
          }),
        );
        console.error(err);
      });
  };

  return (
    <main className="pb-10">
      {error ? (
        <div className="max-w-5xl mx-auto my-10">
          <p className="p-10 text-center text-lg text-danger bg-bg-secondary border border-border rounded-lg">
            {error}
          </p>
        </div>
      ) : fullRepo ? (
        <div>
          <div className="px-10 border-b border-border bg-bg-secondary">
            <div className="pt-5 flex justify-between">
              <div className="flex">
                <GoRepo className="h-5 w-5 text-fg-tertiary mt-2" />
                <span className="flex text-2xl ml-2">
                  <Link
                    href={`/user?username${fullRepo.repo.user}`}
                    className="text-link hover:underline"
                  >
                    {fullRepo.repo.user}
                  </Link>
                  <span className="text-fg-tertiary mx-1 font-semibold">/</span>
                  <span className="text-link hover:underline font-semibold">
                    {fullRepo.repo.repo}
                  </span>
                </span>
                <span className="ml-5 text-sm py-1.5 px-3 rounded-full bg-bg-tertiary text-fg-secondary font-medium border border-border capitalize">
                  {fullRepo.platform_repo.data.repo.visibility}
                </span>
              </div>
            </div>
            <div className="mt-5 flex">
              {[
                ["/repo", "Code", GoCode],
                ["/repo/issues", "Issues", GoIssueOpened],
                ["/repo/pulls", "Pull Requests", GoGitPullRequest],
                ["/repo/discussions", "Discussions", GoCommentDiscussion],
                ["/repo/actions", "Actions", GoPlay],
                ["/repo/projects", "Projects", GoProject],
                ["/repo/wiki", "Wiki", GoBook],
                ["/repo/security", "Security", GoShield],
                ["/repo/insights", "Insights", GoGraph],
              ].map((link, i) => (
                <div
                  key={i}
                  className={clsx(
                    "pb-2 mr-1",
                    pathname === link[0] && "border-b border-orange-500",
                  )}
                >
                  <Link
                    href={`${link[0]}?id=${id}`}
                    className={clsx(
                      "flex px-2 py-1 rounded-lg hover:bg-secondary active:bg-secondary-hover",
                      pathname === link[0] && "font-semibold",
                    )}
                  >
                    {((Icon) => (
                      <Icon className="mt-0.5 h-5 w-5 text-fg-tertiary" />
                    ))(link[2] as IconType)}
                    <span className="ml-2">{link[1] as string}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto flex mt-5">
            <div className="w-full">
              <div className="flex justify-between">
                <div className="flex"></div>
                <div className="flex">
                  <Button variant="success" label="Code" />
                </div>
              </div>

              <div className="mt-2 border border-border rounded-lg">
                <div className="bg-bg-secondary py-3 px-3 border-b border-border rounded-t-lg">
                  Missing information
                </div>
                {fullRepo.tree_items.map((item, i) => (
                  <div
                    key={i}
                    className={clsx(
                      "py-2.5 px-3 flex border-border hover:bg-bg-tertiary/40",
                      i === fullRepo.tree_items.length - 1
                        ? "rounded-b-lg"
                        : "border-b",
                    )}
                  >
                    {item.type === "tree" ? (
                      <GoFileDirectoryFill className="mt-0.5 h-5 w-5 text-link" />
                    ) : (
                      <GoFile className="mt-05 h-5 w-5 text-fg-tertiary" />
                    )}
                    <Link
                      href={`/repo/tree_id=${item.id}`}
                      className="ml-2 hover:text-link hover:underline"
                    >
                      {item.path}
                    </Link>
                  </div>
                ))}
              </div>

              {fullRepo.readme && (
                <div className="mt-10 border border-border rounded-lg">
                  <div className="flex px-5 pt-3 border-b border-border">
                    {[
                      [Tab.Readme, "Readme", GoBook],
                      [Tab.License, "License", GoLaw],
                      [Tab.Security, "Security", GoLaw],
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "pb-2 mr-1",
                          tab === item[0] && "border-b border-orange-500",
                        )}
                      >
                        <button
                          className={clsx(
                            "flex px-2 py-1 rounded-lg hover:bg-secondary active:bg-secondary-hover",
                            tab === item[0] && "font-semibold",
                          )}
                          onClick={() => setTab(item[0] as Tab)}
                        >
                          {((Icon) => (
                            <Icon className="mt-0.5 h-5 w-5 text-fg-tertiary" />
                          ))(item[2] as IconType)}
                          <span className="ml-2">{item[1] as string}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {fullRepo.readme && (
                    <div className="markdown p-5">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          img(props) {
                            const { src, ...rest } = props;
                            return (
                              <img
                                {...rest}
                                src={convertFileSrc(src as string)}
                                alt=""
                              />
                            );
                          },
                        }}
                      >
                        {fullRepo.readme}
                      </Markdown>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-80 w-80 max-w-80 pl-10">
              <h2 className="font-semibold text-xl">About</h2>
              <p className="mt-5 text-lg yes-select cursor-text">
                {fullRepo.platform_repo.data.repo.description}
              </p>
              {fullRepo.platform_repo.data.repo.homepage && (
                <div className="mt-5 flex">
                  <GoLink className="mt-1 h-4 w-4" />
                  <Link
                    href={fullRepo.platform_repo.data.repo.homepage}
                    className="ml-2 font-semibold text-link hover:underline"
                  >
                    {fullRepo.platform_repo.data.repo.homepage}
                  </Link>
                </div>
              )}
              <div className="mt-5 flex flex-wrap">
                {fullRepo.platform_repo.data.topics.map((topic, i) => (
                  <Link
                    key={i}
                    href={`/topics?topic=${topic}`}
                    className="mt-2 mr-2 py-0.5 px-3 rounded-full text-sm font-medium text-link bg-link/15 hover:bg-link/30 active:bg-link/40"
                  >
                    {topic}
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                {[
                  ["#readme", "Readme", GoBook],
                  ["#", "View License", GoLaw],
                  ["#", "Security Policy", GoLaw],
                  ["#", "Activity", GoPulse],
                  ["#", "Custom Properties", GoNote],
                  [
                    "#",
                    fullRepo.platform_repo.data.repo.stargazers_count.toLocaleString() +
                      " stars",
                    GoStar,
                  ],
                  [
                    "#",
                    fullRepo.platform_repo.data.repo.watchers.toLocaleString() +
                      " watching",
                    GoEye,
                  ],
                  [
                    "#",
                    fullRepo.platform_repo.data.repo.forks.toLocaleString() +
                      " forks",
                    GoRepoForked,
                  ],
                ].map((item, i) => (
                  <div className="mt-1" key={i}>
                    <Link
                      href={item[0] as string}
                      className="flex text-sm font-medium text-fg-tertiary hover:text-link"
                    >
                      {((Icon) => (
                        <Icon className="mt-0.5 h-4 w-4" />
                      ))(item[2] as IconType)}
                      <span className="ml-2">{item[1] as string}</span>
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <h2 className="text-2xl">Releases</h2>
              </div>
              <div className="mt-5 pt-5 border-t border-border">
                <Button
                  variant="success-outline"
                  label="Sync Data"
                  size="sm"
                  width="full"
                />
                <Button
                  variant="danger-outline"
                  label="Remove From Database"
                  size="sm"
                  width="full"
                  className="mt-3"
                  onClick={() => removeRepo()}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>loading</div>
      )}
    </main>
  );
}
