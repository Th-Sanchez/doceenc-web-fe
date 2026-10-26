// Downloads the OpenAPI contract from a running backend (dev profile) into openapi/openapi.json.
// Usage: npm run api:sync   (API_DOCS_URL overrides the default URL)
import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.API_DOCS_URL ?? "http://localhost:8080/v3/api-docs";

const response = await fetch(url);
if (!response.ok) {
  console.error(`Could not fetch ${url}: HTTP ${response.status}. Is the backend running with the dev profile?`);
  process.exit(1);
}
const spec = await response.json();
await mkdir("openapi", { recursive: true });
await writeFile("openapi/openapi.json", JSON.stringify(spec, null, 2) + "\n");
console.log(`Saved openapi/openapi.json from ${url}`);
