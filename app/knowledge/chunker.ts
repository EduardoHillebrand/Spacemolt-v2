// Quebra um arquivo markdown em pedaços menores (spec 0004), por seção (`##`/`###`); uma
// seção grande demais quebra por parágrafo. Cada chunk guarda a origem exata.
export interface Chunk {
  source: string;
  section: string;
  text: string;
}

const MAX_CHUNK_CHARS = 2000;

export function chunkMarkdown(source: string, markdown: string): Chunk[] {
  const sections = splitBySections(markdown);
  const chunks: Chunk[] = [];

  for (const section of sections) {
    if (section.text.length <= MAX_CHUNK_CHARS) {
      chunks.push({ source, section: section.title, text: section.text });
      continue;
    }
    for (const part of splitByParagraphs(section.text, MAX_CHUNK_CHARS)) {
      chunks.push({ source, section: section.title, text: part });
    }
  }

  return chunks;
}

function splitBySections(markdown: string): { title: string; text: string }[] {
  const lines = markdown.split("\n");
  const sections: { title: string; text: string }[] = [];
  let currentTitle = "(intro)";
  let currentLines: string[] = [];

  const flush = () => {
    const text = currentLines.join("\n").trim();
    if (text.length > 0) sections.push({ title: currentTitle, text });
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = /^(##|###)\s+(.*)$/.exec(line);
    if (headingMatch) {
      flush();
      currentTitle = headingMatch[2].trim();
    }
    currentLines.push(line);
  }
  flush();

  return sections;
}

function splitByParagraphs(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).flatMap((p) => splitOversizedParagraph(p, maxChars));
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());

  return chunks;
}

// Achado rodando o build real contra a base inteira: uma seção pode ter um único
// "parágrafo" (sem linha em branco no meio, ex. uma lista longa de uma linha só) maior que
// o teto por si só — sem isso, esse pedaço passaria direto e quebraria o limite de contexto
// do modelo de embedding. Corta na força bruta por tamanho quando isso acontece.
function splitOversizedParagraph(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];
  const parts: string[] = [];
  for (let i = 0; i < paragraph.length; i += maxChars) {
    parts.push(paragraph.slice(i, i + maxChars));
  }
  return parts;
}
