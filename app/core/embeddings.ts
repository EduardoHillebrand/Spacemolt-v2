// Único lugar que fala com o endpoint de embeddings do Ollama (spec 0003-memory).
// Compartilhado com a spec 0004-knowledge-base-integration (constituição, regra 5: o que
// é comum entre duas coisas sobe pra core/).
const OLLAMA_URL = "http://localhost:11434/api/embeddings";
const MODEL = "nomic-embed-text";

export async function embed(text: string): Promise<number[]> {
  let response: Response;
  try {
    response = await fetch(OLLAMA_URL, {
      method: "POST",
      body: JSON.stringify({ model: MODEL, prompt: text }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Ollama indisponível em ${OLLAMA_URL}: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ollama devolveu ${response.status} ${response.statusText} em ${OLLAMA_URL}: ${body}`);
  }

  const data = (await response.json()) as { embedding?: number[] };
  if (!Array.isArray(data.embedding)) {
    throw new Error("Resposta do Ollama não trouxe 'embedding' (formato inesperado)");
  }
  return data.embedding;
}
