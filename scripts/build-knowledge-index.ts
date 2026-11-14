// CLI fino: só chama index_builder.build() (spec 0004). Roda manualmente depois de
// atualizar knowledge_base/ (ex.: depois do crawler Python rodar de novo).
import { build } from "../app/knowledge/index_builder.js";

const t0 = Date.now();
await build({
  onProgress: (done, total) => {
    if (done === total || done % 10 === 0) {
      process.stdout.write(`\r${done}/${total} chunks embedados...`);
    }
  },
});
console.log(`\nconcluído em ${((Date.now() - t0) / 1000).toFixed(1)}s`);
