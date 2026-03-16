import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { REPO_ROOT } from "./paths.js";

const execFileAsync = promisify(execFile);

export interface VersionTag {
  tag: string;
  version: string;
}

export interface VersionMarker {
  stack: string;
  version: string;
}

export async function getTagsForStack(
  stack: string
): Promise<VersionTag[]> {
  try {
    const { stdout } = await execFileAsync("git", [
      "tag",
      "-l",
      `${stack}@*`,
      "--sort=-v:refname",
    ], { cwd: REPO_ROOT });

    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((tag) => ({
        tag,
        version: tag.replace(`${stack}@`, ""),
      }));
  } catch {
    return [];
  }
}

export async function getLatestVersion(
  stack: string
): Promise<string | null> {
  const tags = await getTagsForStack(stack);
  return tags.length > 0 ? tags[0].version : null;
}

export async function getChangelogSince(
  stack: string,
  sinceVersion: string
): Promise<string> {
  const tag = `${stack}@${sinceVersion}`;

  try {
    const { stdout } = await execFileAsync("git", [
      "log",
      `${tag}..HEAD`,
      "--oneline",
      "--",
      `claude-skills/${stack}/`,
      `templates/${stack}/`,
    ], { cwd: REPO_ROOT });

    const log = stdout.trim();
    return log || "No changes since that version.";
  } catch {
    return `Tag '${tag}' not found. No changelog available.`;
  }
}

export function parseVersionMarker(content: string): VersionMarker | null {
  const match = content.match(
    /<!--\s*templateCentral:\s*(\S+)@(\S+)\s*-->/
  );
  if (!match) return null;
  return { stack: match[1], version: match[2] };
}
