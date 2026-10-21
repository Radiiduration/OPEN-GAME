# Publish the Open Game website with GitHub Pages

The static project website is located at `docs/index.html`, with its stylesheet and interactions beside it. It has no build step or external runtime dependency. The root `vercel.json` routes the Vercel homepage to this site and makes the Blueprint Studio available at `/studio` (and `studio.html`).

## Preview before publishing

From the repository root:

```sh
npm install
npm run website
```

Open `http://127.0.0.1:4174` and check the install commands, links, mobile navigation, copy buttons, and page sections. Open `http://127.0.0.1:4173` for the local Blueprint Studio.

## Vercel deployment

Connect `Radiiduration/OPEN-GAME` to the Vercel project that owns `opengame-ecru.vercel.app`, and set its production branch to `master`. Leave the project root at the repository root and use the static/no-framework preset with no build command. The committed `vercel.json` sets the output to the repository root, routes `/` to the marketing site in `docs/`, and makes the Blueprint Studio available at `/studio`. A push to `master` triggers a deployment only while that Vercel project remains connected to this repository and branch. Check Vercel's deployment log after the push; repository code cannot verify the external project's linkage or deployment state.

The site's [privacy notice](privacy.html) describes the browser Studio's local draft storage and the external hosting/font providers.

## Enable GitHub Pages

1. Push the website files in `docs/` to the repository's default branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the default branch and the `/docs` folder, then save.
5. Wait for GitHub Pages to finish its first deployment. The Pages panel shows the published address.

For this repository the expected project-site shape is `https://radiiduration.github.io/OPEN-GAME/`; use the actual URL reported by GitHub Pages if the repository owner or Pages settings differ.

## Package releases

`npm run package:release` writes a versioned npm tarball under `dist/`. To publish a GitHub release, create a version tag that matches `package.json`, run the pack command, and attach the `.tgz` to the release. The website links to the repository's Releases page and makes clear that the registry package is not published until the maintainer completes that separate release step.

Before publishing to the npm registry, choose and add the project's license, confirm the package name and maintainer account, then publish from the reviewed release tag. The repository currently has no `LICENSE` file; the GitHub-source install and local tarball workflow do not publish to the public npm registry.
