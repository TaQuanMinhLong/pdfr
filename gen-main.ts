import fs from "fs/promises";
import { viteSingleFile } from "vite-plugin-singlefile";
import vue from "@vitejs/plugin-vue";
import { randomUUID } from "crypto";
import { build } from "vite";
import path from "path";
import { chromium } from "playwright";

export class PdfRenderer {
  templateDir: string;
  constructor(templateDir: string) {
    this.templateDir = path.resolve(templateDir);
  }

  private async renderMain(id: string, name: string, data: Record<string, any>) {
    const content = `import App from "${this.templateDir}/${name}";
import { createApp } from "vue";
const app = createApp(App, ${JSON.stringify(data)});
app.mount("#app");`;
    await fs.writeFile(`${id}/main.ts`, content);
  }

  private async renderTemplate(id: string) {
    const template = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<link rel="icon" type="image/svg+xml" href="/vite.svg" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Vite + Vue + TS</title>
	</head>
	<body>
		<div id="app"></div>
		<script type="module" src="main.ts"></script>
	</body>
</html>
`;
    await fs.writeFile(`${id}/index.html`, template);
  }

  async render(name: string, data: Record<string, any>) {
    const tmpDir = randomUUID();
    const outPath = `${randomUUID()}.pdf`;
    const [browser] = await Promise.all([chromium.launch(), fs.mkdir(tmpDir)]);
    try {
      await Promise.all([
        this.renderMain(tmpDir, name, data),
        this.renderTemplate(tmpDir),
      ]);

      // TODO: Allow passing build config
      // TODO: Add config validation
      await build({
        plugins: [vue(), viteSingleFile()],
        build: { outDir: "out" },
        root: tmpDir,
      });

      const fileURL = `file:///${path.resolve(tmpDir, "out/index.html")}`;

      const page = await browser.newPage();
      await page.goto(fileURL);
      await page.pdf({ path: outPath });
      return outPath;
    } finally {
      await browser.close();
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}
