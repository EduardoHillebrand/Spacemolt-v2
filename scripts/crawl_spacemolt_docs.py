#!/usr/bin/env python3
"""
Build a local knowledge base from spacemolt.com/docs for an autonomous
SpaceMolt-playing agent. Runs in two independent phases so a slow/expensive
phase never has to be redone because a fast one failed:

    1) download  -- fetch every /docs page from the sitemap (prioritizing
                     links.txt), extract clean markdown, save to
                     knowledge_base/raw/<slug>.md. Fast, network-bound.
    2) distill    -- read each knowledge_base/raw/<slug>.md and use a LOCAL
                     Ollama model to rewrite it into actionable notes at
                     knowledge_base/distilled/<slug>.md. Slow, compute-bound.
                     Only touches files that already exist in raw/.

Everything heavy (summarization) runs on local Ollama -- no external API
tokens are spent running this script.

Usage:
    python crawl_spacemolt_docs.py download [--skip-existing]
    python crawl_spacemolt_docs.py distill [--model MODEL_NAME] [--skip-existing]
    python crawl_spacemolt_docs.py all [--model MODEL_NAME] [--skip-existing]

Output (relative to the spacemolt/ folder):
    knowledge_base/raw/<slug>.md        -- clean markdown extracted from the page
    knowledge_base/distilled/<slug>.md  -- Ollama-distilled "useful knowledge" notes
    knowledge_base/INDEX.md             -- index linking every distilled page
"""

import argparse
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

BASE = "https://spacemolt.com"
SITEMAP_URL = f"{BASE}/sitemap.xml"
OLLAMA_URL = "http://localhost:11434/api/generate"

ROOT = Path(__file__).resolve().parent.parent  # .../spacemolt
LINKS_FILE = ROOT / "links.txt"
KB_DIR = ROOT / "knowledge_base"
RAW_DIR = KB_DIR / "raw"
DISTILLED_DIR = KB_DIR / "distilled"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; personal-research-bot/1.0; +local use, respects robots.txt)"
}


# ---------- shared helpers ----------

def fetch(url, timeout=30):
    resp = requests.get(url, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return resp.text


def discover_doc_urls():
    xml = fetch(SITEMAP_URL)
    urls = re.findall(r"<loc>([^<]+)</loc>", xml)
    return [u for u in urls if "/docs" in u]


def load_priority_urls():
    if not LINKS_FILE.exists():
        return []
    lines = [l.strip() for l in LINKS_FILE.read_text(encoding="utf-8").splitlines()]
    return [l for l in lines if l.startswith("http")]


def ordered_urls():
    priority = load_priority_urls()
    try:
        all_urls = discover_doc_urls()
    except Exception as e:
        print(f"AVISO: falha ao ler sitemap ({e}), usando apenas links.txt", flush=True)
        all_urls = []
    seen = set()
    ordered = []
    for u in priority + all_urls:
        if u not in seen:
            seen.add(u)
            ordered.append(u)
    return ordered


def slugify(url):
    path = url.split(BASE, 1)[-1].strip("/")
    return path.replace("/", "_") or "index"


# ---------- phase 1: download ----------

def clean_markdown(text):
    # Strip docs-site permalink wrapper: "[Heading#](#anchor)" -> "Heading"
    text = re.sub(r"\[([^\]]+?)#\]\(#[^)]*\)", r"\1", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_page(url):
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else url
    title = re.sub(r"\s*-\s*SpaceMolt\s*$", "", title)

    content = soup.find("div", class_="docs-markdown")
    if content is None:
        content = soup.find("article")
    if content is None:
        content = soup.find("main")
    if content is None:
        content = soup.body

    markdown = clean_markdown(md(str(content), heading_style="ATX")) if content else ""
    return title, markdown


def cmd_download(args):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    urls = ordered_urls()
    total = len(urls)
    ok = 0
    for i, url in enumerate(urls, 1):
        slug = slugify(url)
        raw_path = RAW_DIR / f"{slug}.md"
        if args.skip_existing and raw_path.exists():
            print(f"[{i}/{total}] {url} -- ja baixado, pulando", flush=True)
            ok += 1
            continue
        print(f"[{i}/{total}] baixando {url}", flush=True)
        try:
            title, markdown = extract_page(url)
        except Exception as e:
            print(f"  ERRO ao buscar pagina: {e}", flush=True)
            continue
        raw_path.write_text(f"# {title}\n\nURL: {url}\n\n{markdown}\n", encoding="utf-8")
        print(f"  OK ({len(markdown)} chars) -> {raw_path.relative_to(ROOT)}", flush=True)
        ok += 1
        time.sleep(0.2)
    print(f"\nDownload concluido: {ok}/{total} paginas salvas em {RAW_DIR.relative_to(ROOT)}", flush=True)


# ---------- phase 2: distill ----------

def parse_raw_file(path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    title = lines[0].lstrip("# ").strip() if lines and lines[0].startswith("#") else path.stem
    url_match = re.search(r"^URL:\s*(\S+)", text, re.M)
    url = url_match.group(1) if url_match else ""
    # content is everything after the "URL: ..." line and the blank line following it
    body = text
    if url_match:
        body = text[url_match.end():]
    body = body.lstrip("\n")
    return title, url, body


DISTILL_PROMPT = """Você está construindo uma base de conhecimento para um AGENTE DE IA autônomo \
que vai jogar o jogo SpaceMolt sozinho, via API do jogo. O texto abaixo é o conteúdo de uma \
página da documentação oficial do jogo.

Sua tarefa: reescrever o conteúdo em notas estruturadas, em português, SEM PERDER nenhuma \
informação útil para jogar bem: mecânicas, números exatos, fórmulas, condições, exceções, \
nomes exatos de comandos/funções/endpoints da API do jogo, estratégias e armadilhas comuns. \
Não resuma de forma vaga -- se o texto contém um número, uma fórmula ou o nome de uma \
função/comando, preserve-o exatamente como está escrito.

Se a página for apenas um índice de navegação sem conteúdo técnico relevante (ex: só uma \
lista de links para outras páginas, sem explicações), responda apenas com a frase exata:
SEM CONTEUDO TECNICO RELEVANTE

Caso contrário, formate a resposta como Markdown começando com "# {title}", seguido de \
seções lógicas (use ## e ###, listas, tabelas quando fizer sentido).

--- CONTEUDO DA PAGINA ({url}) ---
{content}
--- FIM DO CONTEUDO ---

Notas estruturadas:"""


CTX_BUCKETS = [4096, 6144, 8192, 12288, 16384]


def pick_num_ctx(prompt_len_chars):
    # rough estimate: ~3 chars/token for mixed PT/EN + code, plus room for
    # the generated response (~3000 tokens) and a safety margin.
    est_tokens = prompt_len_chars // 3 + 3500
    for bucket in CTX_BUCKETS:
        if est_tokens <= bucket:
            return bucket
    return CTX_BUCKETS[-1]


def ollama_distill(model, title, url, content):
    prompt = DISTILL_PROMPT.format(title=title, url=url, content=content)
    num_ctx = pick_num_ctx(len(prompt))
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"num_ctx": num_ctx, "temperature": 0.2},
    }
    resp = requests.post(OLLAMA_URL, json=payload, timeout=900)
    resp.raise_for_status()
    return resp.json().get("response", "").strip(), num_ctx


def cmd_distill(args):
    DISTILLED_DIR.mkdir(parents=True, exist_ok=True)
    raw_files = sorted(RAW_DIR.glob("*.md"))
    total = len(raw_files)
    if total == 0:
        print("Nenhum arquivo em knowledge_base/raw/. Rode 'download' primeiro.", flush=True)
        return

    index_entries = []
    for i, raw_path in enumerate(raw_files, 1):
        slug = raw_path.stem
        dist_path = DISTILLED_DIR / f"{slug}.md"
        title, url, content = parse_raw_file(raw_path)

        if args.skip_existing and dist_path.exists():
            print(f"[{i}/{total}] {slug} -- ja destilado, pulando", flush=True)
            index_entries.append((slug, url, title))
            continue

        if len(content.strip()) < 40:
            print(f"[{i}/{total}] {slug} -- sem conteudo util, pulando", flush=True)
            continue

        print(f"[{i}/{total}] destilando {slug} com ollama ({args.model})...", flush=True)
        try:
            distilled, used_ctx = ollama_distill(args.model, title, url, content)
            print(f"  (num_ctx={used_ctx})", flush=True)
        except Exception as e:
            print(f"  ERRO no ollama: {e}", flush=True)
            continue

        if "SEM CONTEUDO TECNICO RELEVANTE" in distilled.upper():
            print("  sem conteudo tecnico relevante segundo o modelo, pulando", flush=True)
            continue

        dist_path.write_text(f"<!-- fonte: {url} -->\n\n{distilled}\n", encoding="utf-8")
        index_entries.append((slug, url, title))
        print(f"  OK -> {dist_path.relative_to(ROOT)}", flush=True)

    lines = ["# SpaceMolt Docs - Base de Conhecimento", "",
             "Gerado automaticamente a partir de https://spacemolt.com/docs via Ollama local.", ""]
    for slug, url, title in index_entries:
        lines.append(f"- [{title}](distilled/{slug}.md) -- fonte: {url}")
    (KB_DIR / "INDEX.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nDistillation concluida. {len(index_entries)} paginas na base de conhecimento.", flush=True)


# ---------- CLI ----------

def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="phase", required=True)

    p_dl = sub.add_parser("download", help="baixa e extrai todas as paginas de /docs")
    p_dl.add_argument("--skip-existing", action="store_true")

    p_ds = sub.add_parser("distill", help="destila knowledge_base/raw/*.md com ollama")
    p_ds.add_argument("--model", default="qwen2.5:7b")
    p_ds.add_argument("--skip-existing", action="store_true")

    p_all = sub.add_parser("all", help="roda download e depois distill")
    p_all.add_argument("--model", default="qwen2.5:7b")
    p_all.add_argument("--skip-existing", action="store_true")

    args = parser.parse_args()

    if args.phase == "download":
        cmd_download(args)
    elif args.phase == "distill":
        cmd_distill(args)
    elif args.phase == "all":
        cmd_download(args)
        cmd_distill(args)


if __name__ == "__main__":
    main()
