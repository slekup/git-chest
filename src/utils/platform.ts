import { Platform } from "@typings/platform";

export const platformName = (key: string) => {
  const names: { [key: string]: any } = {
    [Platform.Bitbucket]: "Bitbucket",
    [Platform.GitHub]: "GitHub",
    [Platform.GitLab]: "GitLab",
    [Platform.Gitea]: "Gitea",
  };
  return names[key];
};

export const platformDomain = (key: string) => {
  const names: { [key: string]: any } = {
    [Platform.Bitbucket]: "bitbucket.com",
    [Platform.GitHub]: "github.com",
    [Platform.GitLab]: "gitlab.com",
    [Platform.Gitea]: "gitea.com",
  };
  return names[key];
};
