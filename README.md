# Semantic Versioning Release Action

Action which wraps `semver` package for generate new version, which can be saved in repo or commited as tag.

## Inputs

### `bump`

**Required** The type of semantic version increment to make. One of `major`, `premajor`, `minor`, `preminor`, `patch`, `prepatch`, or `prerelease`.

You may get this value from another action, such as [zwaldowski/match-label-action](https://github.com/zwaldowski/match-label-action).

### `github_token`

**Required**. Used to make API requests for looking through and creating tags. Pass in using `secrets.GITHUB_TOKEN`.

### `version`

**Required**. Pass version which need to increment

### `preid`

**Optional**. 'Identifier to be used to prefix `premajor`, `preminor`, `prepatch` or `prerelease` version increments.

## Outputs

### `version`

The full version number produced by incrementing the semantic version number of the latest tag according to the `bump` input. For instance, given `12.4.1` and `bump: minor`, `12.5.0`.

### `version_optimistic`

The major and minor components of `version`. For instance, given `12.4.1` and `bump: minor`, `12.5`. Use for recommending a non-specific release to users, as in a `~>` declaration in a `Gemfile`.

## Example usage

### Simple

Create a version, f.ex., when merging to master.

```yaml
- id: bump
  uses: zwaldowski/match-label-action@v1
  with:
    allowed: major,minor,patch
- uses: leovs09/semver-release-action@v1
  with:
    version: "0.1.0"
    bump: ${{ steps.bump.outputs.match }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced

Read version from `settings.yaml` inside monorepo `search` folder and generatte new kubernetes manifests, then commit

```yaml
name: Bump search service version
on:
  pull_request:
    branches:
      - main
    types:
    - opened
    - labeled
    - unlabeled
    paths:
      - "search/**"

jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v2
    
    - name: Resolve bump label
      id: bump
      uses: zwaldowski/match-label-action@v1
      with:
        allowed: major,minor,patch
    - name: Read version from settings.yaml and set version variables
      run: |
        VER=$(grep VERSION search/settings.yaml | cut -d '"' -f 2)
        echo "VERSION=$VER" >> $GITHUB_ENV
    - name: Generate new version
      id: next_version
      uses: leovs09/semver-release-action@v1
      with:
        bump: ${{ steps.bump.outputs.match }}
        prefix: search_v
        github_token: ${{ secrets.GITHUB_TOKEN }}
        dry_run: true
        version: ${{ env.VERSION }}
    
    - name: Save new version in image settings.yaml
      run: |-
        cd search
        sed -i -E 's/APP_VERSION: "(.*)"/APP_VERSION: "${{ steps.next_version.outputs.version }}"/g' settings.yaml
    - name: Generate production yaml with new version from template
      run: |-
        cd manifests
        sed -E 's/%VERSION%/${{ steps.next_version.outputs.version }}/g' templates/search.yaml > production/search.yaml
    
    - name: Commit and push changes
      uses: EndBug/add-and-commit@v7
      with: 
        default_author: github_actions
        message: 'search_v${{ steps.next_version.outputs.version }}'
        tag: 'search_v${{ steps.next_version.outputs.version }} --force'

```
