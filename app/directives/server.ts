// Servidor web da diretriz do operador (spec 0012) -- node:http nativo, sem dependência
// nova. Alcançável de fora via o túnel Cloudflare já existente (log/infra.md,
// spacemolt.hillebrand.ia.br -> porta 5000, mesma porta do dashboard antigo que este
// substitui). GET /api/accounts é público (sem segredo); GET/POST /api/directive/:account
// exigem auth básica.
import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { WebSocketServer } from "ws";
import { createDevlogClient } from "../devlog/client.js";
import { createDevlogSubscriber } from "../devlog/subscriber.js";
import { listAccounts } from "../roles/account_role.js";
import { readDirective, writeDirective, type Directive } from "./directive.js";

export const DIRECTIVES_PORT = 5000;

const STATIC_PAGE_PATH = new URL("../../static/directives.html", import.meta.url);
const ACCOUNT_NAME_PATTERN = /^\/api\/directive\/([a-zA-Z0-9_-]+)$/;
const LIVE_FEED_PATH = "/live";

// Conta "pseudo" só pra identificar a origem do evento no devlog -- não é uma conta de
// jogo de verdade (constituição, regra 10: devlog é compartilhado entre processos).
const devlog = createDevlogClient("directives-server");

export interface DirectivesServerHandle {
  close(): void;
}

export interface DirectivesServerOptions {
  /** Injetável só pra teste — produção usa sempre `accounts/`, `roles.json` e o devlog real. */
  accountsDir?: string;
  rolesPath?: string;
  devlogPort?: number;
}

export function startDirectivesServer(
  port: number = DIRECTIVES_PORT,
  options: DirectivesServerOptions = {}
): DirectivesServerHandle {
  const server = createServer((req, res) => {
    handleRequest(req, res, options).catch((err) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(`internal error: ${err instanceof Error ? err.message : String(err)}`);
    });
  });

  // Painel "ao vivo" (requisito novo, página única com diretriz + feed): repassa pro
  // navegador cada evento do devlog (spec 0005) sem o navegador precisar alcançar a porta
  // interna do devlog server (7788, nunca exposta pelo túnel) -- só esta porta (5000, já
  // tunelada) importa de fora. Navegador não sabe mandar header Authorization num handshake
  // de WebSocket, então a credencial aqui vem por query string, só pra este endpoint.
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== LIVE_FEED_PATH || !isAuthorizedForLiveFeed(url)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  const subscriber = createDevlogSubscriber(
    (event) => {
      const payload = JSON.stringify(event);
      for (const client of wss.clients) {
        if (client.readyState === client.OPEN) client.send(payload);
      }
    },
    options.devlogPort !== undefined ? { port: options.devlogPort } : undefined
  );

  server.listen(port);
  return {
    close: () => {
      subscriber.close();
      wss.close();
      server.close();
    },
  };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: DirectivesServerOptions
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    sendHtml(res, readFileSync(STATIC_PAGE_PATH, "utf-8"));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/accounts") {
    sendJson(res, 200, listAccountsPublic(options.rolesPath));
    return;
  }

  const match = url.pathname.match(ACCOUNT_NAME_PATTERN);
  if (match) {
    const accountName = match[1];

    if (!isAuthorized(req)) {
      devlog.emit({ type: "directive_auth_failed", level: "warning", payload: { account: accountName } });
      res.statusCode = 401;
      res.setHeader("WWW-Authenticate", 'Basic realm="spacemolt-directives"');
      res.end("unauthorized");
      return;
    }

    if (req.method === "GET") {
      sendJson(res, 200, readDirective(accountName, options.accountsDir));
      return;
    }
    if (req.method === "POST") {
      const patch = (await readJsonBody(req)) as Partial<Directive>;
      sendJson(res, 200, writeDirective(accountName, patch, options.accountsDir));
      return;
    }
  }

  res.statusCode = 404;
  res.end("not found");
}

function listAccountsPublic(rolesPath?: string): Array<{ name: string; role: string }> {
  const accounts = rolesPath ? listAccounts(rolesPath) : listAccounts();
  return Object.entries(accounts).map(([name, entry]) => ({ name, role: entry.current }));
}

function isAuthorized(req: IncomingMessage): boolean {
  const expectedUser = process.env.DIRECTIVES_USER;
  const expectedPass = process.env.DIRECTIVES_PASS;
  if (!expectedUser || !expectedPass) return false; // sem credencial configurada -- recusa sempre, nunca abre em aberto

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);
  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

function isAuthorizedForLiveFeed(url: URL): boolean {
  const expectedUser = process.env.DIRECTIVES_USER;
  const expectedPass = process.env.DIRECTIVES_PASS;
  if (!expectedUser || !expectedPass) return false;

  const user = url.searchParams.get("user") ?? "";
  const pass = url.searchParams.get("pass") ?? "";
  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual exige mesmo tamanho -- comparar tamanho primeiro não vaza mais do que
  // isso já vazaria de qualquer forma (tempo de rede domina, não isto).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw.length > 0 ? JSON.parse(raw) : {};
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function sendHtml(res: ServerResponse, html: string): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}
