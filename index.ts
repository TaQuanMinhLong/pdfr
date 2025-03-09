import { PdfRenderer } from "./gen-main";

const renderer = new PdfRenderer("./templates");
const id = await renderer.render("app.vue", { message: "Hello" });
console.log(id);

// TODO read hook install browser when install package
