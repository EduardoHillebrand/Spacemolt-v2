// Implementação mínima do Decider (spec 0006): "faz a pergunta, devolve a resposta". Único
// lugar que fala com uma LLM (constituição, regra 2.2). Backend pluggable por design — hoje
// Ollama local, trocar por Claude depois é mudar só este arquivo.
const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "qwen2.5:7b";

export async function ask(question: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(OLLAMA_URL, {
      method: "POST",
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: question }],
        stream: false,
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Ollama indisponível em ${OLLAMA_URL}: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ollama devolveu ${response.status} ${response.statusText} em ${OLLAMA_URL}: ${body}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  if (typeof data.message?.content !== "string") {
    throw new Error("Resposta do Ollama não trouxe message.content (formato inesperado)");
  }
  return data.message.content;
}
