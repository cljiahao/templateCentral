import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStacks, getSkillsForStack } from "../lib/stacks.js";
import { readMarkdownFile } from "../lib/markdown.js";
import { skillPath, codeStandardsPath, agentPath } from "../lib/paths.js";

export function registerResources(server: McpServer): void {
  // List all templates/stacks
  server.resource(
    "templates-list",
    "templatecentral://templates",
    { description: "List all available project templates and stacks" },
    async (uri) => {
      const stacks = await getStacks();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(stacks, null, 2),
          },
        ],
      };
    }
  );

  // Skills for a specific stack
  server.resource(
    "stack-skills",
    new ResourceTemplate("templatecentral://skills/{stack}", {
      list: async () => ({
        resources: (await getStacks()).map((s) => ({
          uri: `templatecentral://skills/${s.name}`,
          name: `${s.name} skills`,
          description: `All skills for the ${s.name} stack`,
        })),
      }),
    }),
    { description: "List all skills for a specific stack" },
    async (uri, { stack }) => {
      const skills = await getSkillsForStack(stack as string);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(skills, null, 2),
          },
        ],
      };
    }
  );

  // Specific skill content
  server.resource(
    "skill-content",
    new ResourceTemplate("templatecentral://skills/{stack}/{skill}", {
      list: async () => {
        const stacks = await getStacks();
        const resources: { uri: string; name: string; description: string }[] = [];
        for (const s of stacks) {
          const skills = await getSkillsForStack(s.name);
          for (const sk of skills) {
            resources.push({
              uri: `templatecentral://skills/${s.name}/${sk.name}`,
              name: `${s.name}/${sk.name}`,
              description: sk.description,
            });
          }
        }
        return { resources };
      },
    }),
    { description: "Get the full content of a specific skill" },
    async (uri, { stack, skill }) => {
      const content = await readMarkdownFile(skillPath(stack as string, skill as string));
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );

  // Code standards for a stack
  server.resource(
    "code-standards",
    new ResourceTemplate("templatecentral://standards/{stack}", {
      list: async () => ({
        resources: (await getStacks()).map((s) => ({
          uri: `templatecentral://standards/${s.name}`,
          name: `${s.name} code standards`,
          description: `Coding conventions for the ${s.name} stack`,
        })),
      }),
    }),
    { description: "Get the coding standards for a specific stack" },
    async (uri, { stack }) => {
      const content = await readMarkdownFile(codeStandardsPath(stack as string));
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );

  // Agent definition for a stack
  server.resource(
    "agent-definition",
    new ResourceTemplate("templatecentral://agents/{stack}", {
      list: async () => ({
        resources: (await getStacks()).map((s) => ({
          uri: `templatecentral://agents/${s.name}`,
          name: `${s.name} agent`,
          description: `Agent definition for the ${s.name} stack`,
        })),
      }),
    }),
    { description: "Get the agent definition (AGENT.md) for a specific stack" },
    async (uri, { stack }) => {
      const content = await readMarkdownFile(agentPath(stack as string));
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );
}
