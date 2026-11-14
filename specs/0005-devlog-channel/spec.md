# 0005 — Devlog Channel

## O quê

Existe um canal central pelo qual qualquer parte do agente, de qualquer conta, publica
eventos estruturados sobre o que está fazendo — decisão tomada, comando executado, erro,
mudança de estado — e qualquer interessado (dashboard, uma sessão de debug) pode assistir a
esses eventos em tempo real, sem que quem publica precise saber se alguém está ouvindo.

## Por quê

- Constituição regra 10: observabilidade nasce com a feature, não é bolt-on depois. Pra isso
  valer desde a `0001`, o canal precisa existir **antes** de qualquer skill ser construída —
  senão cada feature inventaria seu próprio jeito de avisar alguém, e observabilidade
  acabaria virando "adicionar depois" de fato, exatamente o que a regra 10 proíbe.
- Cada conta é um processo separado (constituição, regra 4) — não tem como um observador
  simplesmente "olhar a memória" de outro processo. Precisa de um canal real entre
  processos.
- Depurar um agente autônomo sem supervisão exige saber o que ele está fazendo **em tempo
  real**, não só revisar logs em arquivo depois — ainda mais relevante dado que a visão de
  longo prazo é acompanhar isso do celular (`0012-dashboard-ui`, via o túnel que já existe).

## Requisitos funcionais

1. Qualquer processo (de qualquer conta) publica um evento com tipo, conta de origem,
   timestamp e um payload livre — sem precisar saber se alguém está ouvindo.
2. **Publicar nunca pode falhar o fluxo principal**: se não há ninguém ouvindo, ou o canal
   está indisponível, o processo que publica continua normalmente. Observabilidade é sempre
   um efeito colateral opcional, nunca uma dependência que pode travar o agente.
3. Qualquer processo externo (dashboard, sessão de debug manual) pode se inscrever e receber
   os eventos conforme acontecem — de todas as contas, ou filtrando por uma conta específica.
4. Todo evento tem, sempre, estes campos presentes: tipo, conta de origem, timestamp, nível
   (ex.: info/aviso/erro) — qualquer consumidor pode confiar nisso, independente de quem
   publicou.
5. O canal **não guarda histórico por conta própria** — é só "quem está ouvindo agora
   recebe". Quem quiser histórico persistente grava os eventos recebidos em outro lugar
   (fora de escopo aqui).
6. **Nenhum dado sensível** (senha, token, credencial) pode passar por esse canal — mesma
   regra de segredos da constituição (regra 12), reforçada aqui porque este canal pode vir a
   ser consumido de fora da máquina (dashboard mobile).

## Fora do escopo desta spec

- A UI do dashboard que consome isso — spec `0012-dashboard-ui`.
- Persistência/histórico de eventos — se vier a existir, é outra spec.
- Quem decide o que logar e quando — cada feature decide isso ao emitir, não esta spec.
- Autenticação/autorização de quem pode se inscrever — relevante quando isso for exposto pra
  internet (dashboard mobile via túnel), mas aqui só cobrimos o canal local; expor isso com
  segurança é responsabilidade da `0012`.

## Critério de sucesso

- Rodar dois processos de contas diferentes, abrir uma sessão de escuta, e ver eventos dos
  dois chegando, cada um identificado pela conta de origem.
- Desligar a sessão de escuta (ninguém ouvindo) e confirmar que os processos das contas
  continuam rodando normalmente — sem erro, sem lentidão perceptível.
- Tentar publicar um evento com um campo sensível (teste deliberado) e confirmar que isso é
  impedido — não é "boa prática a seguir", é garantido pelo canal.
