import fs from "node:fs/promises";

export interface Frontmatter {
  name: string;
  description: string;
  body: string;
}

export function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { name: "", description: "", body: content };
  }

  const [, yaml, body] = match;
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  const descMatch = yaml.match(/^description:\s*(.+)$/m);

  return {
    name: nameMatch?.[1]?.trim() ?? "",
    description: descMatch?.[1]?.trim() ?? "",
    body: body.trim(),
  };
}

export async function readMarkdownFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }
}
