import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerDiscoveryTools } from "./tools/discovery.js";
import { registerScaffoldTools } from "./tools/scaffold.js";
import { registerUpdateTools } from "./tools/updates.js";
import { registerResources } from "./resources/resources.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "templatecentral",
    version: "0.1.0",
  });

  registerDiscoveryTools(server);
  registerScaffoldTools(server);
  registerUpdateTools(server);
  registerResources(server);

  return server;
}
