# Updating the upstream version

Gitea ships as a single Docker image (`gitea/gitea`) whose tag tracks the upstream Git release.

## Determining the upstream version

Latest upstream release ([go-gitea/gitea](https://github.com/go-gitea/gitea)):

```
gh release view -R go-gitea/gitea --json tagName -q .tagName
```

Strip the leading `v` (e.g. `v1.26.1` -> `1.26.1`) to get the Docker tag. Confirm the image has been published to [Docker Hub](https://hub.docker.com/r/gitea/gitea/tags):

```
curl -fsSL "https://hub.docker.com/v2/repositories/gitea/gitea/tags?page_size=20&ordering=last_updated" | jq -r '.results[].name'
```

The pin lives in `startos/manifest/index.ts` as `images.gitea.source.dockerTag`.

## Applying the bump

In `startos/manifest/index.ts`, update the `dockerTag` to `gitea/gitea:<new version>` (e.g. `gitea/gitea:1.26.1`).
