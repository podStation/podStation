#!/usr/bin/env bash

last_version_tag=$(git describe --tags --abbrev=0)
next_version_tag=v$(cat ./package.json | jq -r ".version")

if [ $last_version_tag != $next_version_tag ]
then
    echo "Version changed to" $next_version_tag ", previous was" $last_version_tag
    export NEXT_VERSION_TAG=$next_version_tag
	export VERSION_HAS_CHANGED=1
else
	echo "Current version is the same as previous version:" $next_version_tag
fi