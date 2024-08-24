"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { invoke } from "@tauri-apps/api/core";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";

import {
  Button,
  Input,
  Label,
  Select,
  MultiSelect,
  SwitchBox,
} from "@components";
import { useDispatch } from "react-redux";
import { addToast } from "@slices/toasts.slice";
import { ToastType } from "@typings/core";

interface Directory {
  id: number;
  name: string;
  directories: Directory[];
}

enum Platform {
  GitHub = "github",
  GitLab = "gitlab",
  Gitea = "gitea",
}

enum Watch {
  Branches = "branches",
  Contributors = "contributors",
  Commits = "commits",
  Discussions = "discussions",
  Forks = "forks",
  Issues = "issues",
  PullRequests = "pull_requests",
  Releases = "releases",
  Stars = "stars",
  Tags = "tags",
}

enum AutoSync {
  Disabled,
  Enabled,
  Global,
}

interface AddRepoForm {
  directory?: number;
  platform: Platform;
  user: string;
  repo: string;
  clone_data: boolean;
  watching: Watch[];
  auto_sync: AutoSync;
}

export default function Add() {
  const [directoryName, setDirectoryName] = useState<string | undefined>();
  const [directories, setDirectories] = useState<Directory[] | undefined>();
  const [fromURL, setFromURL] = useState<string | undefined>();

  const { register, handleSubmit, control, setValue } = useForm<AddRepoForm>();
  const dispatch = useDispatch();

  const params = useSearchParams();
  const directoryId = params.get("directory_id");

  useEffect(() => {
    if (directoryId) {
      invoke<string>("get_directory_name", { id: parseInt(directoryId) })
        .then(setDirectoryName)
        .catch(console.error);
    } else {
      invoke<Directory[]>("get_directories")
        .then(setDirectories)
        .catch(console.error);
    }
  }, [directoryId]);

  const fillFromUrl = (value: string) => {
    value = value.trim();
    const nonSupportedProtocols = ["http", "git", "ssh", "file"];
    if (nonSupportedProtocols.some((p) => value.startsWith(`${p}://`)))
      return dispatch(
        addToast({
          title: "Unsupported Protocol",
          description: "This protocol is not currently supported.",
          type: ToastType.Error,
        }),
      );
    if (value.startsWith("https://")) value = value.replace("https://", "");

    const platforms: [string, Platform][] = [
      ["github.com", Platform.GitHub],
      ["gitlab.com", Platform.GitLab],
      ["gitea.com", Platform.Gitea],
    ];
    const platform = platforms.find((p) => value.startsWith(p[1]));

    if (!platform) return;
    value = value.replace(platform[0] + "/", "");
    if (value.endsWith("/")) value = value.slice(0, -1);

    let split_value = value.split("/");
    if (split_value.length != 2) return;

    let [user, repo] = split_value;

    setValue("platform", platform[1]);
    setValue("user", user);
    setValue("repo", repo);

    dispatch(
      addToast({
        title: "success",
        description: `platform: ${platform[1]}\nuser: ${user}\nrepo: ${repo}`,
        type: ToastType.Success,
      }),
    );
  };

  const onSubmit: SubmitHandler<AddRepoForm> = async (data) => {
    return;
  };

  return (
    <main className="max-w-3xl mx-auto my-10 p-5">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mt-5">
          <Label text="From URL" />
          <Input
            className="mt-1"
            onChange={(e) => fillFromUrl(e.target.value)}
          />
        </div>

        <div className="mt-5">
          <Label text="Platform" />
          <div className="mt-1">
            <Controller
              name="platform"
              control={control}
              defaultValue={Platform.GitHub}
              render={({ field: { onChange, value } }) => (
                <Select
                  options={[
                    ["GitHub", Platform.GitHub],
                    ["GitLab", Platform.GitLab],
                    ["Gitea", Platform.Gitea],
                  ].map((platform) => ({
                    label: (
                      <div className="flex">
                        <Image
                          className="-mt-0.5"
                          src={`/${platform[1]}.svg`}
                          height={26}
                          width={27}
                          alt={`${platform[1]} Logo SVG`}
                        />
                        <p className="pl-2">{platform[0]}</p>
                      </div>
                    ),
                    value: platform[1],
                  }))}
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>
        </div>

        <div className="mt-5 flex">
          <div className="w-1/2 mr-2">
            <Label text="User" />
            <Input
              className="mt-1"
              {...register("user", {
                required: true,
              })}
            />
          </div>
          <div className="w-1/2 ml-2">
            <Label text="Repo" />
            <Input
              className="mt-1"
              {...register("repo", {
                required: true,
              })}
            />
          </div>
        </div>

        <div className="mt-10 py-5 border-y border-border">
          <Controller
            name="clone_data"
            control={control}
            render={({ field: { value, onChange } }) => (
              <SwitchBox
                title="Clone Data"
                description="Download the contents of the repository as well.\nThis will take up more storage space."
                value={value}
                onChange={onChange}
              />
            )}
          />
        </div>

        <div className="py-5 border-b border-border flex">
          <div className="w-1/2 pr-2">
            <Label text="Watch Events" />
            <div className="mt-1">
              <Controller
                name="watching"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MultiSelect
                    title={
                      value?.length === 10
                        ? "Watch all events"
                        : value?.length > 0
                          ? `Watch ${value.length} event${value.length > 1 ? "s" : ""}`
                          : "No events to watch"
                    }
                    options={[
                      {
                        label: "Branches",
                        value: Watch.Branches,
                      },
                      {
                        label: "Contributors",
                        value: Watch.Contributors,
                      },
                      {
                        label: "Commits",
                        value: Watch.Commits,
                      },
                      {
                        label: "Discussions",
                        value: Watch.Discussions,
                      },
                      {
                        label: "Forks",
                        value: Watch.Forks,
                      },
                      {
                        label: "Issues",
                        value: Watch.Issues,
                      },
                      {
                        label: "Pull Requests",
                        value: Watch.PullRequests,
                      },
                      {
                        label: "Releases",
                        value: Watch.Releases,
                      },
                      {
                        label: "Stars",
                        value: Watch.Stars,
                      },
                      {
                        label: "Tags",
                        value: Watch.Tags,
                      },
                    ]}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="w-1/2 pl-2">
            <Label text="Automatic Sync" />
            <div className="mt-1">
              <Controller
                name="auto_sync"
                control={control}
                defaultValue={AutoSync.Global}
                render={({ field: { value, onChange } }) => (
                  <Select
                    options={[
                      {
                        label: "Disabled",
                        value: AutoSync.Disabled,
                      },
                      {
                        label: "Enabled",
                        value: AutoSync.Enabled,
                      },
                      {
                        label: "Global Setting",
                        value: AutoSync.Global,
                      },
                    ]}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Button type="submit" label="Add Repository" variant="success" />
        </div>
      </form>
    </main>
  );
}
