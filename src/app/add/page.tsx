"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import { useDispatch } from "react-redux";

import { HiOutlineEyeOff, HiX, HiCheck } from "react-icons/hi";
import { HiOutlineEye, HiEye, HiOutlineCog6Tooth } from "react-icons/hi2";
import {
  LuBug,
  LuGitBranch,
  LuGitCommit,
  LuGitFork,
  LuGitPullRequest,
  LuMessagesSquare,
  LuRocket,
  LuStar,
  LuTags,
  LuUsers2,
} from "react-icons/lu";

import { addToast } from "@slices/toasts.slice";
import { ToastType } from "@typings/core";
import {
  Button,
  Input,
  Label,
  Select,
  MultiSelect,
  SwitchBox,
  Modal,
} from "@components";

interface Directory {
  id: number;
  name: string;
  directories: Directory[];
}

enum Platform {
  Bitbucket = "bitbucket",
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
  platform: Platform;
  user: string;
  repo: string;
  submodules: boolean;
  clone_data: boolean;
  watching: Watch[];
  auto_sync: AutoSync;
}

export default function Add() {
  const [directoryName, setDirectoryName] = useState<string | undefined>();
  const [directories, setDirectories] = useState<Directory[] | undefined>();
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [fromURL, setFromURL] = useState<string>("");

  const dispatch = useDispatch();
  const params = useSearchParams();
  const directoryId = params.get("directory_id");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddRepoForm>();

  useEffect(() => {
    if (directoryId) {
      // TODO: Implement get_directory_name function
      // invoke<string>("get_directory_name", { id: parseInt(directoryId) })
      //   .then(setDirectoryName)
      //   .catch(console.error);
    } else {
      // TODO: Implement get_directories function
      // invoke<Directory[]>("get_directories")
      //   .then(setDirectories)
      //   .catch(console.error);
    }
  }, [directoryId]);

  const fillFail = (msg: string) => {
    dispatch(
      addToast({
        title: "Failed to Fill Form from URL",
        description: msg,
        type: ToastType.Error,
      }),
    );
    setShowUrlInput(false);
  };

  const fillFromURL = () => {
    let value = fromURL;
    value = value.trim();
    const nonSupportedProtocols = ["http", "git", "ssh", "file"];
    if (nonSupportedProtocols.some((p) => value.startsWith(`${p}://`)))
      return fillFail("Protocol not currently supported.");
    if (value.startsWith("https://")) value = value.replace("https://", "");

    const platforms: [string, Platform][] = [
      ["bitbucket.com", Platform.Bitbucket],
      ["github.com", Platform.GitHub],
      ["gitlab.com", Platform.GitLab],
      ["gitea.com", Platform.Gitea],
    ];
    const platform = platforms.find((p) => value.startsWith(p[0]));
    if (!platform)
      return fillFail("Unsupported platform or incorrect domain name.");
    value = value.replace(platform[0] + "/", "");
    if (value.endsWith("/")) value = value.slice(0, -1);

    let split_value = value.split("/");
    if (split_value.length < 2) return fillFail("User or repo not provided.");
    let [user, repo] = split_value;

    setValue("platform", platform[1]);
    setValue("user", user);
    setValue("repo", repo);
    setShowUrlInput(false);
  };

  const minUserLength = {
    bitbucket: 1,
    github: 1,
    gitlab: 1,
    gitea: 2,
  };

  const maxUserLength = {
    bitbucket: 39,
    github: 39,
    gitlab: 255,
    gitea: 40,
  };

  const maxRepoLength = {
    bitbucket: 100,
    github: 100,
    gitlab: 255,
    gitea: 100,
  };

  const onSubmit: SubmitHandler<AddRepoForm> = async (data) => {
    alert("asdf");
    return;
  };

  return (
    <>
      <main className="max-w-3xl mx-auto my-10 p-5">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="pb-5">
            <Button
              label="Fill from URL"
              size="sm"
              variant="secondary"
              onClick={() => setShowUrlInput(true)}
            />
          </div>

          <div className="pt-3 border-t border-border">
            <Label
              text="Platform"
              badge={{
                text: "Bug",
                variant: "success",
                icon: LuBug,
              }}
            />
            <div className="mt-1">
              <Controller
                name="platform"
                control={control}
                rules={{
                  required: true,
                }}
                defaultValue={Platform.GitHub}
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={[
                      {
                        name: "Bitbucket",
                        id: Platform.Bitbucket,
                        disabled: true,
                      },
                      { name: "GitHub", id: Platform.GitHub },
                      { name: "GitLab", id: Platform.GitLab, disabled: true },
                      { name: "Gitea", id: Platform.Gitea, disabled: true },
                    ].map((platform) => ({
                      label: (
                        <div className="flex">
                          <Image
                            className="-mt-0.5"
                            src={`/${platform.id}.svg`}
                            alt={`${platform.name} Logo SVG`}
                            width={26}
                            height={26}
                          />
                          <p className="pl-2">
                            {platform.name}
                            <span className="opacity-50">
                              {platform.disabled ? " (unsupported)" : ""}
                            </span>
                          </p>
                        </div>
                      ),
                      value: platform.id,
                      disabled: platform.disabled,
                    }))}
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                    }}
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-3 pb-6 flex">
            <div className="w-1/2 mr-2">
              <Label text="User" />
              <Input
                className="mt-1"
                placeholder="octocat"
                error={errors.user}
                {...register("user", {
                  required: true,
                  minLength: {
                    value: minUserLength[getValues("platform")],
                    message: `Users cannot have less than ${minUserLength[getValues("platform")]} characters on the selected platform.`,
                  },
                  maxLength: {
                    value: maxUserLength[getValues("platform")],
                    message: `Users cannot have more than ${maxUserLength[getValues("platform")]} characters on the selected platform.`,
                  },
                })}
              />
            </div>
            <div className="w-1/2 ml-2">
              <Label text="Repo" />
              <Input
                className="mt-1"
                placeholder="Hello-World"
                error={errors.repo}
                {...register("repo", {
                  required: true,
                  maxLength: {
                    value: maxRepoLength[getValues("platform")],
                    message: `Repositories cannot have more than ${maxRepoLength[getValues("platform")]} characters on the selected platform.`,
                  },
                })}
              />
            </div>
          </div>

          <div className="py-5 border-t border-border">
            <Controller
              name="submodules"
              control={control}
              rules={{
                required: true,
              }}
              defaultValue={true}
              render={({ field: { value, onChange } }) => (
                <SwitchBox
                  title="Add submodules"
                  description="Add submodules as repositories to git-chest with identical settings to this repository."
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>

          <div className="py-5 border-t border-border">
            <Controller
              name="clone_data"
              control={control}
              defaultValue={false}
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

          <div className="py-5 border-t border-border flex">
            <div className="w-1/2 pr-2">
              <Label text="Watch Events" />
              <div className="mt-1">
                <Controller
                  name="watching"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <MultiSelect
                      title={
                        <span className="flex">
                          {value?.length === 10 ? (
                            <>
                              <HiEye className="h-5 w-5 my-0.5 mr-3 text-success" />
                              <span>Watch all events</span>
                            </>
                          ) : value?.length > 0 ? (
                            <>
                              <HiOutlineEye className="h-5 w-5 my-0.5 mr-3 text-warning" />
                              <span>
                                Watch {value.length} event
                                {value.length > 1 ? "s" : ""}
                              </span>
                            </>
                          ) : (
                            <>
                              <HiOutlineEyeOff className="h-5 w-5 my-0.5 mr-3 text-danger" />
                              <span>Watch no events</span>
                            </>
                          )}
                        </span>
                      }
                      options={[
                        {
                          icon: LuGitBranch,
                          label: "Branches",
                          value: Watch.Branches,
                        },
                        {
                          icon: LuUsers2,
                          label: "Contributors",
                          value: Watch.Contributors,
                        },
                        {
                          icon: LuGitCommit,
                          label: "Commits",
                          value: Watch.Commits,
                        },
                        {
                          icon: LuMessagesSquare,
                          label: "Discussions",
                          value: Watch.Discussions,
                        },
                        {
                          icon: LuGitFork,
                          label: "Forks",
                          value: Watch.Forks,
                        },
                        {
                          icon: LuBug,
                          label: "Issues",
                          value: Watch.Issues,
                        },
                        {
                          icon: LuGitPullRequest,
                          label: "Pull Requests",
                          value: Watch.PullRequests,
                        },
                        {
                          icon: LuRocket,
                          label: "Releases",
                          value: Watch.Releases,
                        },
                        {
                          icon: LuStar,
                          label: "Stars",
                          value: Watch.Stars,
                        },
                        {
                          icon: LuTags,
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
                          icon: HiX,
                          label: "Disabled",
                          value: AutoSync.Disabled,
                        },
                        {
                          icon: HiCheck,
                          label: "Enabled",
                          value: AutoSync.Enabled,
                        },
                        {
                          icon: HiOutlineCog6Tooth,
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

          <div className="pt-5 border-t border-border">
            <Button type="submit" label="Add Repository" variant="success" />
          </div>
        </form>
      </main>

      <Modal open={showUrlInput} setOpen={setShowUrlInput}>
        <div className="p-5">
          <Label text="URL" />
          <Input
            placeholder="https://github.com/octocat/Hello-World"
            className="mt-2"
            value={fromURL}
            onChange={(e) => setFromURL(e.target.value)}
          />
        </div>
        <div className="p-5 border-t border-border">
          <Button
            label="Fill Inputs"
            onClick={() => {
              fillFromURL();
              setFromURL("");
            }}
          />
          <Button
            label="Cancel"
            variant="danger-outline"
            className="ml-3"
            onClick={() => {
              setShowUrlInput(false);
              setFromURL("");
            }}
          />
        </div>
      </Modal>
    </>
  );
}
