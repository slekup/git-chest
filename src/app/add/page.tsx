"use client";

import React, { useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import clsx from "clsx";

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

enum RepoEvent {
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
  add_submodules: boolean;
  clone_data: boolean;
  watch_events: RepoEvent[];
  auto_sync: AutoSync;
}

interface AddRepoProgress {
  progress: number;
  task_id: string;
  step: number;
  total_steps: number;
}

const repoProgressTaskDescription: { [key: string]: any } = {
  insert_basic_info: "Add basic information to database",
  fetch_metadata: "Fetch metadata from platform",
  insert_metadata: "Add metadata to database",
  fetch_tree: "Fetch tree from platform",
  insert_tree: "Add tree contents to database (potentially slow)",
  fetch_readme: "Fetch README from platform",
  insert_readme: "Add README to database",
};

const repoProgressTaskIds = [
  "insert_basic_info",
  "fetch_metadata",
  "insert_metadata",
  "fetch_tree",
  "insert_tree",
  "fetch_readme",
  "insert_readme",
];

export default function Add() {
  const [directoryName, setDirectoryName] = useState<string | undefined>();
  const [directories, setDirectories] = useState<Directory[] | undefined>();
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [fromURL, setFromURL] = useState<string>("");
  const [addingRepo, setAddingRepo] = useState<boolean>(false);
  const [addRepoProgress, setAddRepoProgress] = useState<AddRepoProgress[]>([]);

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

  useEffect(() => {
    type RemoveListenerBlock = () => void;
    let removeListener: RemoveListenerBlock | undefined;

    console.log("starting to listen");

    const setUpListener = async () => {
      removeListener = await listen<AddRepoProgress>(
        "add-repo-progress",
        (event) => {
          let newAddRepoProgress = addRepoProgress.filter(
            (task) => task.task_id !== event.payload.task_id,
          );
          setAddRepoProgress([...newAddRepoProgress, event.payload]);
        },
      );
    };

    setUpListener().catch((error) => {
      console.error(`Could not set up window event listener. ${error}`);
    });

    return () => {
      removeListener?.();
    };
  }, [addRepoProgress]);

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
    setAddingRepo(true);

    invoke<number>("add_repo", {
      repo: {
        platform: data.platform,
        user: data.user,
        repo: data.repo,
        clone_data: data.clone_data,
        auto_sync: data.auto_sync,
        add_submodules: data.add_submodules,
        watch_events: data.watch_events ?? [],
      },
    })
      .then((id) => {
        console.log(id);
        setAddingRepo(false);
        dispatch({
          title: "Successfully added repository.",
          description: `User: ${data.user}\nRepository:${data.repo}`,
          type: ToastType.Success,
        });
        /// TODO: Redirect to the repo page.
        redirect("/");
      })
      .catch((err) => {
        setAddingRepo(false);
        dispatch(
          addToast({
            title: "Failed to add repo",
            description: err,
            type: ToastType.Error,
          }),
        );
        console.error(err);
      });
  };

  return addingRepo ? (
    addRepoProgress ? (
      <main className="max-w-3xl mx-auto my-10 p-5">
        <div className="bg-bg-secondary border border-border p-5 rounded-lg">
          {repoProgressTaskIds.map((task_id, i) =>
            (({ current_i, task }) => (
              <div
                key={i}
                className={clsx(
                  "flex mt-5 w-full transition-[opacity] duration-500",
                  current_i < i && "opacity-30",
                )}
              >
                <HiCheck className={clsx("h-7 w-7 text-success")} />
                <div className="ml-5 w-full">
                  <div className="flex justify-between">
                    <p className="text-fg-secondary">
                      {repoProgressTaskDescription[current_i]}
                      <div className="flex ml-1 text-sm">
                        {task?.step && task?.total_steps && (
                          <span className="text-base text-fg-secondary mr-2">
                            {task.step}/{task.total_steps}
                          </span>
                        )}
                        <span className="text-fg-tertiary">
                          {current_i > i
                            ? "completed"
                            : current_i === i
                              ? task?.progress
                              : "pending"}
                        </span>
                      </div>
                    </p>
                  </div>
                  <div className="block w-full mt-1 h-1 rounded-lg bg-bg-tertiary">
                    <div
                      className="block w-1/2 h-full rounded-lg bg-gradient-to-r from-success-active to-success transition-[width] duration-500"
                      style={{
                        width:
                          current_i > i
                            ? "100%"
                            : current_i === i
                              ? `${task?.task_id ?? 0}%`
                              : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))({
              current_i: repoProgressTaskIds.findIndex(
                (id) =>
                  id == addRepoProgress[addRepoProgress.length - 1].task_id,
              ),
              task: addRepoProgress.find((task) => task.task_id == task_id),
            }),
          )}
        </div>
      </main>
    ) : (
      <></>
    )
  ) : (
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
            <Label text="Platform" />
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
              name="add_submodules"
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
                  name="watch_events"
                  control={control}
                  defaultValue={[]}
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
                          value: RepoEvent.Branches,
                        },
                        {
                          icon: LuUsers2,
                          label: "Contributors",
                          value: RepoEvent.Contributors,
                        },
                        {
                          icon: LuGitCommit,
                          label: "Commits",
                          value: RepoEvent.Commits,
                        },
                        {
                          icon: LuMessagesSquare,
                          label: "Discussions",
                          value: RepoEvent.Discussions,
                        },
                        {
                          icon: LuGitFork,
                          label: "Forks",
                          value: RepoEvent.Forks,
                        },
                        {
                          icon: LuBug,
                          label: "Issues",
                          value: RepoEvent.Issues,
                        },
                        {
                          icon: LuGitPullRequest,
                          label: "Pull Requests",
                          value: RepoEvent.PullRequests,
                        },
                        {
                          icon: LuRocket,
                          label: "Releases",
                          value: RepoEvent.Releases,
                        },
                        {
                          icon: LuStar,
                          label: "Stars",
                          value: RepoEvent.Stars,
                        },
                        {
                          icon: LuTags,
                          label: "Tags",
                          value: RepoEvent.Tags,
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
