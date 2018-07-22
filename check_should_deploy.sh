#!/usr/bin/env bash

last_version_tag=$(git describe --tags --abbrev=0)
current_version=v$(cat extension/manifest.json | jq -r ".version")

if [ $last_version_tag != $current_version ]
then
    echo "Version changed to" $current_version ", previous was" $last_version_tag
    export NEW_VERSION=$current_version
fi