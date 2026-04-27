#!/bin/sh
# Verifies that the wallClockToUtc helper duplicated between two cron functions
# stays byte-identical. See the SHARED-BEGIN / SHARED-END block in either file
# for context on why we duplicate instead of importing a shared module.
set -e

FILE_A="base44/functions/checkScheduledPosts/entry.ts"
FILE_B="base44/functions/updateExpiredPostStatuses/entry.ts"
MARKER_BEGIN="SHARED-BEGIN: wallClockToUtc"
MARKER_END="SHARED-END: wallClockToUtc"

# Portable form — BSD/macOS mktemp requires a template (no default), and `-t`
# has incompatible semantics between GNU and BSD. Explicit path works on both.
TMP_A=$(mktemp "${TMPDIR:-/tmp}/cron-sync.XXXXXX")
TMP_B=$(mktemp "${TMPDIR:-/tmp}/cron-sync.XXXXXX")
trap 'rm -f "$TMP_A" "$TMP_B"' EXIT

awk "/$MARKER_BEGIN/,/$MARKER_END/" "$FILE_A" > "$TMP_A"
awk "/$MARKER_BEGIN/,/$MARKER_END/" "$FILE_B" > "$TMP_B"

if [ ! -s "$TMP_A" ]; then
  echo "ERROR: $MARKER_BEGIN / $MARKER_END markers missing in $FILE_A" >&2
  exit 1
fi
if [ ! -s "$TMP_B" ]; then
  echo "ERROR: $MARKER_BEGIN / $MARKER_END markers missing in $FILE_B" >&2
  exit 1
fi

if ! diff -q "$TMP_A" "$TMP_B" >/dev/null; then
  echo "ERROR: shared cron helper has diverged between cron functions:" >&2
  echo "  $FILE_A" >&2
  echo "  $FILE_B" >&2
  echo "" >&2
  echo "Diff:" >&2
  diff "$TMP_A" "$TMP_B" >&2 || true
  echo "" >&2
  echo "Edit both files identically between the SHARED-BEGIN and SHARED-END markers." >&2
  exit 1
fi

echo "✓ wallClockToUtc in sync between cron functions"
