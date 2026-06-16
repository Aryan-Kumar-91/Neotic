#!/bin/sh

git filter-branch -f --env-filter '
CORRECT_NAME="toxicbishop"
CORRECT_EMAIL="pranavarun19@gmail.com"

case "$GIT_COMMITTER_NAME" in
    *123531*|*dependabot*)
        export GIT_COMMITTER_NAME="$CORRECT_NAME"
        export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
        ;;
esac

case "$GIT_COMMITTER_EMAIL" in
    *123531*|*dependabot*)
        export GIT_COMMITTER_NAME="$CORRECT_NAME"
        export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
        ;;
esac

case "$GIT_AUTHOR_NAME" in
    *123531*|*dependabot*)
        export GIT_AUTHOR_NAME="$CORRECT_NAME"
        export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
        ;;
esac

case "$GIT_AUTHOR_EMAIL" in
    *123531*|*dependabot*)
        export GIT_AUTHOR_NAME="$CORRECT_NAME"
        export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
        ;;
esac
' --msg-filter '
sed -e "/[Cc]o-[Aa]uthored-[Bb]y:.*123531/d" \
    -e "/[Cc]o-[Aa]uthored-[Bb]y:.*dependabot/d" \
    -e "/[Ss]igned-[Oo]ff-[Bb]y:.*dependabot/d"
' --tag-name-filter cat -- --branches --tags
