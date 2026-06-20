# Updating the upstream version

Forgejo ships as a single container image (`codeberg.org/forgejo/forgejo`) whose tag tracks the upstream Forgejo release, published to the [Codeberg container registry](https://codeberg.org/forgejo/-/packages/container/forgejo/versions).

## Determining the upstream version

Forgejo is developed on [Codeberg](https://codeberg.org/forgejo/forgejo), which exposes a Forgejo/Gitea-compatible API (`gh` targets GitHub, so it does not apply here). List the most recent stable releases:

```
curl -fsSL "https://codeberg.org/api/v1/repos/forgejo/forgejo/releases?limit=15&draft=false" \
  | jq -r '.[] | select(.prerelease == false) | .tag_name'
```

Strip the leading `v` (e.g. `v15.0.3` -> `15.0.3`) to get the image tag.

> **Forgejo ships parallel release lines.** A current line (e.g. `15.0.x`) and an older LTS line (e.g. `11.0.x`) receive patches side by side, so the most _recently published_ tag is not always the highest version — an LTS patch can land the same day as a current-line patch. This package tracks the **current** line; pick the highest version, not merely the newest by date.

Confirm the tag has been published as a container image:

```
docker manifest inspect codeberg.org/forgejo/forgejo:15.0.3 >/dev/null && echo published
```

The pin lives in `startos/manifest/index.ts` as `images.forgejo.source.dockerTag`.

## Applying the bump

In `startos/manifest/index.ts`, update the `dockerTag` to `codeberg.org/forgejo/forgejo:<new version>` (e.g. `codeberg.org/forgejo/forgejo:15.0.3`).
