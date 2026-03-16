import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readMarkdownFile } from "../lib/markdown.js";
import {
  parseVersionMarker,
  getLatestVersion,
  getChangelogSince,
} from "../lib/version.js";
import { validateStack } from "../lib/stacks.js";
import { agentPath, codeStandardsPath } from "../lib/paths.js";

export function registerUpdateTools(server: McpServer): void {
  server.tool(
    "check_updates",
    "Check if a scaffolded project's AGENTS.md is behind the latest templateCentral version. Returns current vs latest version and a summary of changes.",
    {
      project_agents_md_path: z
        .string()
        .describe("Absolute path to the project's AGENTS.md file"),
    },
    async ({ project_agents_md_path }) => {
      let content: string;
      try {
        content = await readMarkdownFile(project_agents_md_path);
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Could not read file: ${project_agents_md_path}`,
            },
          ],
          isError: true,
        };
      }

      const marker = parseVersionMarker(content);
      if (!marker) {
        return {
          content: [
            {
              type: "text",
              text: "No templateCentral version marker found in this AGENTS.md. This project may not have been scaffolded by templateCentral, or the marker was removed.",
            },
          ],
        };
      }

      const latest = await getLatestVersion(marker.stack);
      if (!latest) {
        return {
          content: [
            {
              type: "text",
              text: `Project is on ${marker.stack}@${marker.version}. No version tags found in templateCentral — tag the repo (e.g., 'git tag ${marker.stack}@1.0.0') to enable version tracking.`,
            },
          ],
        };
      }

      if (marker.version === latest) {
        return {
          content: [
            {
              type: "text",
              text: `Project is up to date: ${marker.stack}@${marker.version}`,
            },
          ],
        };
      }

      const changelog = await getChangelogSince(marker.stack, marker.version);

      return {
        content: [
          {
            type: "text",
            text: [
              `Update available for ${marker.stack}:`,
              `  Current: ${marker.version}`,
              `  Latest:  ${latest}`,
              "",
              "Changes:",
              changelog,
            ].join("\n"),
          },
        ],
      };
    }
  );

  server.tool(
    "get_changelog",
    "Get the changelog (git commits) for a stack since a specific version",
    {
      stack: z.string().describe("Stack name (e.g., 'nextjs')"),
      since_version: z.string().describe("Version to compare from (e.g., '1.0.0')"),
    },
    async ({ stack, since_version }) => {
      await validateStack(stack);
      const changelog = await getChangelogSince(stack, since_version);
      return {
        content: [
          {
            type: "text",
            text: `# Changelog for ${stack} since ${since_version}\n\n${changelog}`,
          },
        ],
      };
    }
  );

  server.tool(
    "preview_update",
    "Preview what would change in a project's agent instructions if updated to the latest templateCentral version. Does NOT apply changes — informational only.",
    {
      project_agents_md_path: z
        .string()
        .describe("Absolute path to the project's AGENTS.md file"),
      sections: z
        .array(z.string())
        .describe(
          "Sections to preview (e.g., ['code-standards', 'agent-definition'])"
        ),
    },
    async ({ project_agents_md_path, sections }) => {
      let projectContent: string;
      try {
        projectContent = await readMarkdownFile(project_agents_md_path);
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Could not read file: ${project_agents_md_path}`,
            },
          ],
          isError: true,
        };
      }

      const marker = parseVersionMarker(projectContent);
      if (!marker) {
        return {
          content: [
            {
              type: "text",
              text: "No templateCentral version marker found. Cannot determine stack for comparison.",
            },
          ],
          isError: true,
        };
      }

      const results: string[] = [
        `# Update Preview for ${marker.stack} (${marker.version} → latest)`,
        "",
      ];

      for (const section of sections) {
        results.push(`## ${section}`);
        results.push("");

        try {
          let filePath: string;
          if (section === "agent-definition") {
            filePath = agentPath(marker.stack);
          } else if (section === "code-standards") {
            filePath = codeStandardsPath(marker.stack);
          } else {
            results.push(
              `Unknown section '${section}'. Valid sections: code-standards, agent-definition`
            );
            results.push("");
            continue;
          }

          const latestContent = await readMarkdownFile(filePath);
          results.push("### Latest content:");
          results.push("");
          results.push(latestContent);
          results.push("");
        } catch {
          results.push(`Could not read latest ${section} content.`);
          results.push("");
        }
      }

      return {
        content: [{ type: "text", text: results.join("\n") }],
      };
    }
  );
}
