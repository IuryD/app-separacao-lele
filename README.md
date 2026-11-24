# App de separação — LEIA ANTES DE MEXER

O app (https://capable-squirrel-dfd4f1.netlify.app) é **um só** e é usado por dois projetos: **Be Honest** (separação, NF-e) e **Perda / Uso e consumo** (baixas, hortifruti, painel). Em 24/11 os dois projetos fizeram versões diferentes a partir da mesma v11 e uma quase apagou a outra. Por isso:

## Regras
1. **Cópia oficial única:** este repositório no GitHub (IuryD/app-separacao-lele). O Netlify publica a partir dele. Não usar pastas `separacao-app-vNN` da Downloads como base.
2. **Antes de mudar:** puxar a versão mais nova do repositório (git pull / fetch). Nunca partir de cópia antiga.
3. **Depois de mudar:** subir o número em `CACHE = 'separacao-vNN'` (sw.js), escrever o que mudou no `LEIA-ME.txt` (dizendo de qual projeto veio) e fazer commit + push. A pasta do Obsidian `06 FB Mercados/App Separacao` é só uma cópia de consulta.
4. **Não arrastar .zip no Netlify:** a publicação sai do repositório.
5. Quem é dono de quê:
   - `index.html` → separação / Be Honest
   - `baixas.js` → tela inicial, painel do gerente, perda e uso e consumo, recebimento do hortifruti
   - `firestore.rules` → cópia das regras publicadas no Firebase

## Versão atual
- **v14** (24/11/2026, cache `separacao-v18`): junção das duas linhas. Ver `LEIA-ME.txt`.

## Próximo passo recomendado
Ligar o app a um repositório no GitHub com publicação automática no Netlify: cada mudança vira um registro, as duas linhas se juntam sozinhas e nada se perde.
