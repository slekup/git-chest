# Git Chest

Git Chest is a desktop application that allows you to own a local database of repository metadata (data optional). This includes data specific to git hosting platforms such as issues, discussions, pull requests, and more.

## Features

- **Archiving:** Keep historical copies of remote repositories, including platform-specific data.
- **Updates:** Watch any user, organization, and repository events.
- **Analysis:** Run your own queries on repositories using Sqlite without restriction.
- **Mirroring:** Automatically sync changes from remote repositories to your local database.
- **Authentication:** Increase rate limits by using your own auth tokens.
- **Browsing:** Browse repository READMEs, file trees, and other metadata offline without needing to clone the entire repository.

## Supported Git Hosts

- [x] GitHub
- [ ] GitLab
- [ ] Gitea

## Run in development

```sh
git clone https://github.com/slekup/git-chest
cargo tauri dev
# or pnpm/yarn/npm tauri dev
```

## License

Licensed under either of

- Apache License, Version 2.0
  ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license
  ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Contribution

Unless you explicitly state otherwise, any Contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
