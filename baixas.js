/* =====================================================================
   Lelê Supermercados — Perda e Uso e consumo
   Módulo extra do app de separação. Carregado depois do script principal:
   <script src="baixas.js"></script>  (logo antes de </body> no index.html)

   - Tela inicial com 2 opções: Separação | Perda e uso e consumo
   - Funcionário bipa (ou busca) o produto, escolhe Perda (Vencido/Danificado)
     ou Uso e consumo, digita a quantidade e salva.
   - Grava na coleção "baixas" do Firestore com status "pendente".
     Depois de lançado no Avanço, o status vira "lancado".
   - Gerente: importa a tabela de produtos do Avanço (código, descrição,
     código de barras, custo) e vê o resumo do que está pendente.
   ===================================================================== */
(function(){
  if (typeof S === 'undefined' || typeof render !== 'function') return;

  // Produtos sem código de barras (hortifruti, açougue, padaria) — botões rápidos.
  // cod|descrição|unidade|grupo  (H = hortifruti, A = açougue, P = padaria)
  const RAPIDOS = `209|TOMATE KG|KG|H
207|BANANA NANICA KG|KG|H
206|BANANA PRATA KG|KG|H
208|BANANA TERRA KG|KG|H
215|CEBOLA KG|KG|H
6547|CEBOLA ROXA KG|KG|H
210|BATATA MONALISA KG|KG|H
213|LIMAO THAITI KG|KG|H
212|LARANJA RIO KG|KG|H
233|MACA NACIONAL KG|KG|H
217|ABOBORA CABOTIA KG|KG|H
234|MARACUJA KG|KG|H
231|PIMENTAO VERDE KG|KG|H
552|PEPINO JAPONES KG|KG|H
200|REPOLHO VERDE KG|KG|H
214|CHUCHU KG|KG|H
224|CENOURA KG|KG|H
296|MAMAO FORMOSA KG|KG|H
235|MELANCIA KG|KG|H
226|COCO SECO KG|KG|H
268|GENGIBRE KG|KG|H
250|BATATA DOCE KG|KG|H
96549|GOIABA KG|KG|H
3650|PIMENTA DE CHEIRO PCT|UN|H
6546|BROCOLIS JAPONES UN|UN|H
6559|TOMATE CEREJA BD|UN|H
295|MORANGO BD|UN|H
27101|UVA SEM SEMENTE BDJ|UN|H
7608|VAGEM BDJ|UN|H
7016|JILO BD|UN|H
3250|MILHO VERDE BD|UN|H
221|FOLHAS DIVERSAS|UN|H
16|ACEM ESPECIAL KG|KG|A
265|FILE PEITO KG|KG|A
160|MUSCULO DIANT KG|KG|A
69|SALSICHA HOT DOG KG|KG|A
5054|QUEIJO MEIA CURA KG|KG|A
5043|PAO FRANCES KG|KG|P
5070|SALGADO FESTA KG|KG|P
5083|TORRADA KG|KG|P
5038|PAO DE HAMBURGUER PCT|UN|P
5044|PAO HOTDOG PCT|UN|P
5048|PAO PROMOCAO PCT|UN|P
5052|PUDIM LEITE PEDACO|UN|P
5019|BOLO REDONDO SABORES|UN|P
5096|BOLO EM TIRA CENOURA PROMO|UN|P
5085|SALGADO PROMO 1UN|UN|P
79189|PANO XADREZ DISTR BC 45X65CM|UN|L|4.90
21385|VASSOURA LAVA TUDO|UN|L|15.52
30140|VASSOURA SUPER PELO PLUS COM CAPA MENDONÇA|UN|L|14.22
89219|AGUA SANIT Q BOA 5L|UN|L|12.89
102973|LIMPA FORNO PASTA SOL 230G|UN|L|9.98
92286|ALCOOL LIQ SOL 1L 46%|UN|L|5.59
90173|LIMP VEJA 500ML MULTI USO|UN|L|3.30
1416|DETERG LIQ YPE 500ML MACA|UN|L|2.03
91341|DETERG LIQ AZULIM 500ML CITRUS|UN|L|1.90
91400|DETERG LIQ AZULIM 500ML CLEAR|UN|L|1.90
96092|BRILHA ALUMINIO ESTRELA 500ML LIMAO|UN|L|2.28
94420|BRILHA ALUMINIO ESTRELA 500ML TRAD|UN|L|2.28
29885|SABAO ESTRELA ECONOMICO UNIT 180GR|UN|L|1.31
57207|ESPONJA LIMP TININDO UN|UN|L|1.00
93722|PAPEL HIG PALOMA 4X30M PERF|UN|L|2.89
30900|TOALHA PAPEL SNOB CLASSICA 120FLS 2X1UN|UN|L|4.79
101565|PAPEL TOALHA MAXIN STYLUS BCA 2X50 UN|UN|L|3.49
27555|CR DENTAL BIANCO 70G SUPERMINT|UN|L|1.99
45705|OLEO SOJA SOYA 900ML PET|UN|C|6.19
91633|LEITE PORTO ALEGRE 1L INTEGRAL|UN|C|4.79
94534|LEITE ITALAC 1L INTEGRAL TM|UN|C|4.79
108289|CAFE TORRADO E MOIDO ALPINOPOLIS 500G|UN|C|8.95
974|ACUCAR REFINADO UNIAO 1KG|UN|C|3.60
97343|ACUCAR CORURIPE 5KG|UN|C|10.90
7678|ACUCAR DEMERARA DA BARRA 1KG|UN|C|4.11
56480|SAL REF MARLIN 1KG|UN|C|1.70
58890|OVOS ONAKADO VERMELHO 10X1|UN|C|8.90
104772|OVO CODORNA SOL NASCENTE 30UN|UN|C|6.00
7892|MILHO VERDE MINAS 200G SACHET|UN|C|2.64
3275|PREDILECTA MILHO EM CONSERVA 170G|UN|C|2.58
108588|MILHO SELETA PREDILECTA 170G SACHE|UN|C|2.71
22779|AZEIT VERDE TOZZI 80G FATIADA SACHE|UN|C|2.97
27998|EXT TOMATE ELEFANTE 300G POTE|UN|C|5.40
33685|MAIONESE QUERO 200G SACHET|UN|C|2.59
108644|MOSTARDA AMARELA HEMMER 700G|UN|C|13.49
2990|BATATA PALHA SELECAO 150G|UN|C|5.29
1835|CALDO KNORR 114G GALINHA|UN|C|3.19
2029|TEMP SAZON 60G VERMELHO|UN|C|4.78
32425|TEMP SAZON 60G NORDESTE|UN|C|4.78
1626|COLORIFICO SINHA 500G|UN|C|4.38
90967|CANELA EM CASCA FA 30G|UN|C|5.13
85219|VINAGRE CASTELO 750ML LIMAO|UN|C|8.15
1333|TRIGO QUIBE PACHA 500G|UN|C|4.49
30585|ABACAXI EM CALDALATA 400 GRS TOZZI|UN|C|14.78
25051|HAMBURG FRIBOI 56G BOVINO|UN|C|1.47
24932|HAMBUR FRIBOI 56G AVES E BOVINO|UN|C|1.03
1927|REFRI MINEIRO GUARANA 2L|UN|C|6.08
31574|REFRI IT 2L GUARANA|UN|C|5.50
26033|REFR FRESH 15G ABACAXI|UN|C|1.02
31332|FRISCO ABACAXI 18G|UN|C|0.71
108931|COPO DESC. PLASTICO 180ML TRANSLUCIDO|UN|C|1.80
41580|CANETA BIC - AZUL|UN|E|0.71
76856|CANETA BIC VERMELHO|UN|E|0.56
108922|STARSCHOOL CADERNO COSTURADO UNIVERSITARIO CD 80F|UN|E|8.07
86762|FITA EMPAC SCOTH TRANSP 45MM X 45M|UN|E|4.13
52906|PILHA PANASONIC AAA 2UN|UN|E|6.75
28854|PARAFUSO C/BUCHA N-08|UN|E|2.85
103763|U.PROCESSADOR MANUAL 3 LAMINAS 500ML|UN|E|16.15`.split('\n').map(l => { const [cod, desc, un, g, c] = l.split('|'); return {cod, desc, un, g, ean: '', custo: +c || 0}; });
  const GRUPOS = {H: '🥬 Hortifruti', A: '🥩 Açougue', P: '🥖 Padaria'};
  const GRUPOS_USO = {L: '🧽 Limpeza', C: '☕ Copa e cozinha', E: '📎 Escritório e outros'};
  const MOTIVOS = {VENCIDO: 'Vencido', DANIFICADO: 'Danificado'};

  const BX = {
    tipo: localStorage.getItem('bx.tipo') || 'PERDA',
    motivo: '',
    prod: null,             // produto escolhido {cod, ean, desc, un, custo}
    pend: new Map(),        // baixas pendentes (Firestore)
    sub: null,
    prods: null,            // tabela de produtos do Avanço
    porEan: new Map(), porCod: new Map(), porDesc: new Map(),
    grupo: '', busca: '',
    func: localStorage.getItem('bx.func') || ''
  };
  window.BX = BX;

  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
  const fq = (q, un) => un === 'KG' ? String(+(+q).toFixed(3)).replace('.', ',') + ' kg' : String(+q).replace('.', ',') + ' un';
  const real = v => 'R$ ' + (v || 0).toFixed(2).replace('.', ',');
  const dig = s => String(s || '').replace(/\D/g, '');
  const hoje = () => new Date().toISOString().slice(0, 10);

  /* ---------- Custo do dia do hortifruti (gravado pela rotina "CEASA ALTERADO" em config/custosHorti) ---------- */
  BX.custoHorti = {}; BX.subCH = null;
  function aplicarCustosHorti(){
    for (const [cod, v] of Object.entries(BX.custoHorti)){
      const c = +v; if (!(c > 0)) continue;
      const p = BX.porCod.get(cod); if (p) p.custo = c;
      const r = RAPIDOS.find(x => x.cod === cod); if (r) r.custo = c;
    }
  }
  function assinarCustosHorti(){
    if (BX.subCH || !S.db) return;
    BX.subCH = true;
    BX.subCH = S.db.collection('config').doc('custosHorti').onSnapshot(d => {
      BX.custoHorti = (d.exists && d.data().custos) || {}; BX.custoHortiEm = d.exists ? d.data().em : '';
      aplicarCustosHorti();
      if (['menu', 'baixas', 'horti'].includes(S.view)) render();
    }, () => {});
  }

  /* ---------- Tabela de produtos do Avanço (coleção produtosLele, em pedaços de texto) ---------- */
  async function carregarProdutos(forcar){
    assinarCustosHorti();
    if (BX.prods && !forcar){
      // Já carregada: de minuto em minuto confere se o gerente importou uma tabela nova
      if (S.db && Date.now() - (BX.prodChk || 0) > 60000){
        BX.prodChk = Date.now();
        try{ const mt = await S.db.collection('produtosLele').doc('meta').get(); const e2 = mt.exists ? mt.data().em : '';
          if (e2 && e2 !== BX.prodEm){ BX.prods = null; return carregarProdutos(true); } }catch(e){}
      }
      return;
    }
    BX.prods = []; BX.porEan.clear(); BX.porCod.clear(); BX.porDesc.clear();
    RAPIDOS.forEach(p => { BX.porCod.set(p.cod, p); });
    if (!S.db) return;
    try{
      // Cópia no aparelho: só baixa de novo quando o gerente importar outra tabela
      let txt = '';
      const meta = await S.db.collection('produtosLele').doc('meta').get();
      const em = meta.exists ? meta.data().em : ''; BX.prodEm = em; BX.prodChk = Date.now();
      try{ if (em && localStorage.getItem('bx.prodEm') === em) txt = localStorage.getItem('bx.prodTxt') || ''; }catch(e){}
      if (!txt){
        const snap = await S.db.collection('produtosLele').get();
        txt = snap.docs.filter(d => d.id !== 'meta').sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true})).map(d => d.data().txt || '').join('\n');
        try{ localStorage.setItem('bx.prodTxt', txt); localStorage.setItem('bx.prodEm', em); }catch(e){}
      }
      [txt].forEach(t => {
        t.split('\n').forEach(l => {
          if (!l) return;
          const [cod, eans, desc, un, custo] = l.split('|');
          const p = {cod: cod.startsWith('EAN') ? '' : cod, ean: (eans || '').split(',')[0], desc, un: un || (/\bKG$/.test(desc) ? 'KG' : 'UN'), custo: num(custo)};
          BX.prods.push(p); if (p.cod) BX.porCod.set(p.cod, p); if (!BX.porDesc.has(desc)) BX.porDesc.set(desc, p);
          (eans || '').split(',').filter(Boolean).forEach(e => BX.porEan.set(e.replace(/^0+/, ''), p));
        });
      });
    }catch(e){ console.warn('produtosLele', e); }
    // Códigos antigos que o Avanço trocou (lançamentos velhos continuam achando o produto)
    const ALIAS_COD = {'7227': '233', '428': '3650'};
    for (const [velho, novo] of Object.entries(ALIAS_COD)){ const p = BX.porCod.get(novo); if (p) BX.porCod.set(velho, p); }
    // Códigos de barras que existem no Avanço mas não vêm na lista exportada (código de barras secundário)
    const EAN_EXTRA = {'7622210530066': {cod: '100840', desc: 'BISC. OREO ORIG 18GR', un: 'UN', custo: 0.59}};
    for (const [e, x] of Object.entries(EAN_EXTRA)){ if (!BX.porEan.has(e)){ const p = BX.porCod.get(x.cod) || {...x, ean: e}; BX.porEan.set(e, p); if (!BX.porCod.has(x.cod)) BX.porCod.set(x.cod, p); } }
    // Código interno de produtos que só vêm com código de barras na lista do Avanço (digitar o código também acha)
    const COD_EAN = {'96978': '7898949924272', '79189': '7898933206605', '90033': '7898933206698', '92597': '7898113014761'};
    for (const [cod, e] of Object.entries(COD_EAN)){ const p = BX.porEan.get(e); if (p){ if (!p.cod) p.cod = cod; BX.porCod.set(cod, p); } }
    aplicarCustosHorti();
    religarFora();
    if (S.view === 'baixas' || S.view === 'menu') render();
  }

  // Lançamentos "fora da tabela" cujo código/EAN já existe na tabela: completa nome, código e custo
  async function religarFora(){
    if (!S.admin || !S.db || !BX.prods || !BX.prods.length || !BX.pend || !BX.pend.size) return;
    const alvo = [...BX.pend.values()].filter(b => b.fora || (!b.custo && (b.cod || b.ean)));
    if (!alvo.length) return;
    const b0 = S.db.batch(); let n = 0;
    for (const b of alvo){
      const p = (b.ean && BX.porEan.get(String(b.ean).replace(/^0+/, ''))) || (b.cod && BX.porCod.get(b.cod)) || porNome(b.desc) || null;
      if (!p || !p.desc) continue;
      const up = {fora: false, desc: p.desc, cod: p.cod || b.cod || '', un: p.un || b.un || 'UN', custo: b.custo || p.custo || 0};
      if (!b.ean && p.ean) up.ean = p.ean;
      b0.update(S.db.collection('baixas').doc(b.id), up); Object.assign(b, up); n++;
    }
    if (!n) return;
    try{ await b0.commit(); if (S.view === 'baixas') renderLista(); }catch(e){ console.warn('religar', e); }
  }

  // Gerente: importar planilha exportada do Avanço (colunas: código, descrição, código de barras/EAN, custo)
  async function importarProdutos(file){
    const wb = XLSX.read(await file.arrayBuffer(), {type: 'array'});
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, defval: ''});
    const hi = linhas.findIndex(r => r.some(c => /descri/i.test(c)));
    if (hi < 0){ toast('Não achei a coluna de descrição na planilha.', 'err'); return; }
    const H = linhas[hi].map(c => String(c).toLowerCase());
    const col = re => H.findIndex(h => re.test(h));
    const cCod = col(/^c[óo]d(igo)?\b(?!.*barra)|interno|^c[óo]d\.?$/), cDesc = col(/descri/), cEan = col(/barra|ean|gtin/), cCusto = col(/custo/), cUn = col(/^un(id|\.|$)/);
    if (cDesc < 0 || (cCod < 0 && cEan < 0)){ toast('A planilha precisa ter descrição e código (ou código de barras).', 'err'); return; }
    const mapa = new Map();
    for (const r of linhas.slice(hi + 1)){
      const desc = String(r[cDesc]).trim().replace(/\|/g, '/');
      let cod = cCod >= 0 ? String(r[cCod]).trim() : '';
      if (!cod && cEan >= 0){ const b = dig(r[cEan]).replace(/^0+/, ''); cod = b.length && b.length <= 6 ? b : 'EAN' + b; }  // código curto = código interno (ex.: 209 tomate)
      if (!cod || !desc) continue;
      const m = mapa.get(cod) || {cod, desc, eans: new Set(), un: cUn >= 0 ? String(r[cUn]).trim().toUpperCase() : '', custo: cCusto >= 0 ? num(String(r[cCusto]).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '')) : 0};
      if (cEan >= 0) String(r[cEan]).split(/[,;\s]+/).map(dig).filter(e => e.replace(/^0+/, '').length >= 7).forEach(e => m.eans.add(e));
      mapa.set(cod, m);
    }
    const txt = [...mapa.values()].map(m => [m.cod, [...m.eans].join(','), m.desc, (m.un === 'KG' || / KG$/.test(m.desc)) ? 'KG' : 'UN', m.custo ? m.custo.toFixed(2) : ''].join('|'));
    const old = await S.db.collection('produtosLele').get();
    const b = S.db.batch(); old.docs.forEach(d => b.delete(d.ref));
    const em = new Date().toISOString();
    for (let i = 0; i * 4000 < txt.length; i++) b.set(S.db.collection('produtosLele').doc('p' + i), {txt: txt.slice(i * 4000, (i + 1) * 4000).join('\n'), em});
    b.set(S.db.collection('produtosLele').doc('meta'), {em, n: txt.length});
    await b.commit();
    toast(mapa.size + ' produtos importados.', 'ok'); try{ localStorage.removeItem('bx.prodEm'); }catch(e){}
    await carregarProdutos(true);
  }

  /* ---------- Baixas pendentes ---------- */
  function assinar(){
    if (BX.sub || !S.db) return;
    BX.sub = true; BX.sub = S.db.collection('baixas').where('status', '==', 'pendente').onSnapshot(snap => {
      BX.pend = new Map(snap.docs.map(d => [d.id, {id: d.id, ...d.data()}]));
      religarFora();
      if (S.view === 'baixas') renderLista();
    }, e => toast('Erro ao ler baixas: ' + e.message, 'err'));
  }

  function acharProduto(code){
    const c = dig(code);
    if (!c) return null;
    if (c.length <= 6) return BX.porCod.get(c) || BX.porCod.get(String(+c)) || null;   // código interno
    return BX.porEan.get(c.replace(/^0+/, '')) || null;
  }

  // Custo do lançamento; se veio sem custo, pega o da tabela de produtos
  function custoDe(b){
    if (b.custo) return b.custo;
    const p = (b.cod && BX.porCod.get(b.cod)) || (b.ean && BX.porEan.get(String(b.ean).replace(/^0+/, ''))) || porNome(b.desc);
    return (p && p.custo) || 0;
  }
  window.custoDe = custoDe;
  // Produto digitado pelo nome: acha no cadastro pelo nome exato (com ou sem " KG" no fim)
  function porNome(d){
    d = String(d || '').trim().toUpperCase(); if (!d) return null;
    return BX.porDesc.get(d) || BX.porDesc.get(d + ' KG') || BX.porDesc.get(d.replace(/ KG$/, '')) || RAPIDOS.find(r => r.desc === d || r.desc === d + ' KG') || null;
  }

  // Busca por nome: nome exato e "começa com" primeiro, depois os mais curtos
  function buscarNome(texto, base, n){
    const t = texto.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
    const q = t.join(' ');
    const nota = p => p.desc === q || p.desc === q + ' KG' ? 0 : p.desc.startsWith(q) ? 1 : 2;
    return base.filter(p => t.every(x => p.desc.includes(x))).sort((a, b) => nota(a) - nota(b) || a.desc.length - b.desc.length).slice(0, n);
  }

  function bxMsg(t, kind){ const m = $('#scanMsg'); if (m){ m.className = 'msg ' + kind; m.textContent = t; } }

  function escolher(p){
    BX.prod = {...p};
    BX.busca = '';
    renderForm();
    setTimeout(() => { const q = $('#bxQtd'); if (q){ q.focus(); q.select(); } }, 60);
  }

  function bxBipar(code){
    const p = acharProduto(code);
    if (typeof fecharCamera === 'function' && $('#cam')) fecharCamera();
    if (p){ bxMsg('✓ ' + p.desc, 'ok'); try{ beep(true); }catch(e){} escolher(p); }
    else {
      try{ beep(false); }catch(e){}
      bxMsg('Código ' + code + ' não está na tabela do app. Digite o nome do produto abaixo.', 'warn');
      escolher({cod: '', ean: dig(code), desc: '', un: 'UN', custo: 0, novo: true});
    }
  }

  async function salvar(){
    const p = BX.prod; if (!p) return;
    const desc = (p.novo ? ($('#bxDesc')?.value || '') : p.desc).trim().toUpperCase();
    const qtd = num($('#bxQtd')?.value);
    if (!desc){ toast('Digite o nome do produto.', 'err'); return; }
    if (!(qtd > 0)){ toast('Digite a quantidade.', 'err'); return; }
    if (p.un !== 'KG' && qtd % 1){ toast('Este produto é por unidade: use número inteiro.', 'err'); return; }
    if (BX.tipo === 'PERDA' && !BX.motivo){ toast('Escolha o motivo: Vencido ou Danificado.', 'err'); return; }
    if (!BX.func){
      const n = prompt('Seu nome (fica salvo neste celular):', ''); if (!n || !n.trim()) return;
      BX.func = n.trim(); localStorage.setItem('bx.func', BX.func);
    }
    if (p.novo){ const m = porNome(desc); if (m){ Object.assign(p, {cod: m.cod || '', ean: m.ean || p.ean, un: m.un || p.un, custo: m.custo || 0, novo: false}); } }
    const doc = {
      tipo: BX.tipo, motivo: BX.tipo === 'PERDA' ? BX.motivo : '',
      cod: p.cod || '', ean: p.ean || '', desc: p.novo ? desc : (p.desc || desc), un: p.un || 'UN', qtd: +qtd.toFixed(3),
      custo: p.custo || 0, fora: !!p.novo, func: BX.func, criadoEm: new Date().toISOString(), status: 'pendente'
    };
    const btn = $('#bxSalvar'); if (btn) btn.disabled = true;
    try{
      if (S.db) await S.db.collection('baixas').add(doc);
      else { const l = JSON.parse(localStorage.getItem('bx.local') || '[]'); l.push(doc); localStorage.setItem('bx.local', JSON.stringify(l)); }
      toast('Salvo: ' + desc + ' · ' + fq(doc.qtd, doc.un) + ' · ' + (BX.tipo === 'PERDA' ? 'Perda (' + MOTIVOS[BX.motivo] + ')' : 'Uso e consumo'), 'ok');
      BX.prod = null; renderForm();
      setTimeout(() => $('#bxScan')?.focus(), 60);
    }catch(e){ toast('Não salvou: ' + e.message, 'err'); if (btn) btn.disabled = false; }
  }

  function apagar(id){
    const b = BX.pend.get(id); if (!b) return;
    if (!confirm('Apagar ' + b.desc + ' (' + fq(b.qtd, b.un) + ')?')) return;
    S.db.collection('baixas').doc(id).delete().catch(e => toast('Não apagou: ' + e.message, 'err'));
  }

  /* ---------- Telas ---------- */
  /* ---------- Tela inicial / painel do gerente ---------- */
  const CSS = `
    .lele-hero{background:linear-gradient(135deg,#d9141e,#a50d1c 70%);color:#fff;border-radius:18px;padding:16px;margin-bottom:12px;position:relative;overflow:hidden}
    .lele-hero:after{content:"";position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,204,0,.18)}
    .lele-logo{background:#fff;border-radius:14px;padding:8px 12px;display:inline-block;box-shadow:0 4px 14px rgba(0,0,0,.18)}
    .lele-logo img{height:54px;display:block}
    .lele-hero .oi{font-size:20px;font-weight:800;margin-top:12px}
    .lele-hero .dt{opacity:.9;font-size:14px}
    .lele-hero .pill{display:inline-block;margin-top:10px;background:#ffcc00;color:#5a1a00;font-weight:700;font-size:13px;padding:4px 10px;border-radius:99px;cursor:pointer}
    .kpis4{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}
    @media(min-width:700px){.kpis4{grid-template-columns:repeat(4,1fr)}}
    .kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;border-top:4px solid #d9141e}
    .kpi.y{border-top-color:#f2b600}.kpi.g{border-top-color:var(--green)}.kpi.k{border-top-color:#333}
    .kpi .l{font-size:12px;color:var(--mut);font-weight:700;text-transform:uppercase;letter-spacing:.03em}
    .kpi .v{font-size:22px;font-weight:800;margin:4px 0 2px;font-variant-numeric:tabular-nums}
    .kpi .s{font-size:12px;color:var(--mut)}
    .lele-bars{display:flex;align-items:flex-end;gap:3px;height:110px;padding-top:6px}
    .lele-bars div{flex:1;background:#d9141e;border-radius:3px 3px 0 0;min-height:2px;position:relative}
    .lele-bars div.hj{background:#f2b600}
    .lele-ax{display:flex;justify-content:space-between;font-size:11px;color:var(--mut);margin-top:4px}
    .top5 .r{display:grid;grid-template-columns:1fr auto;gap:2px 8px;margin:8px 0}
    .top5 .b{grid-column:1/-1;height:6px;border-radius:99px;background:var(--line);overflow:hidden}
    .top5 .b i{display:block;height:100%;background:#d9141e}
    .atalho{display:flex;gap:12px;align-items:center;padding:16px}
    .atalho .ic{font-size:30px;width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fdecec}
    .atalho h3{margin:0;font-size:18px}`;
  if (!document.getElementById('leleCss')){ const st = document.createElement('style'); st.id = 'leleCss'; st.textContent = CSS; document.head.appendChild(st); }

  const inicioMes = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); };
  BX.mes = new Map(); BX.subMes = null;
  function assinarMes(){
    if (BX.subMes || !S.db || !S.admin) return;
    BX.subMes = true; BX.subMes = S.db.collection('baixas').where('criadoEm', '>=', inicioMes()).onSnapshot(snap => {
      BX.mes = new Map(snap.docs.map(d => [d.id, {id: d.id, ...d.data()}]));
      if (S.view === 'menu') render();
    }, () => {});
  }

  function saudacao(){ const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }

  function renderMenu(app){
    $('#title').textContent = CFG.nomeLoja || 'Lelê Supermercados';
    let dt = new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'}); dt = dt.charAt(0).toUpperCase() + dt.slice(1);
    const atalhos = `
      <div class="card pedido atalho" onclick="go('inicio')"><div class="ic" style="background:#e3f3ea">📦</div>
        <div style="flex:1"><h3>Separação</h3><div class="mut">Pedidos da Be Honest: separar, conferir e liberar.</div></div><b style="font-size:22px;color:var(--mut)">›</b></div>
      <div class="card pedido atalho" onclick="go('baixas')"><div class="ic">🗑️</div>
        <div style="flex:1"><h3>Perda e uso e consumo</h3><div class="mut">Lançar produto vencido, danificado ou usado na loja.</div></div><b style="font-size:22px;color:var(--mut)">›</b></div>
      <div class="card pedido atalho" onclick="go('horti')"><div class="ic" style="background:#fff6d6">🥬</div>
        <div style="flex:1"><h3>Recebimento hortifruti</h3><div class="mut">Pesar a mercadoria que chegou (entra com PIN).</div></div><b style="font-size:22px;color:var(--mut)">›</b></div>`;
    const hero = extra => `<div class="lele-hero"><div class="lele-logo"><img src="logo-lele.png" alt="Lelê Supermercados" onerror="this.parentNode.style.display='none'"></div>
      <div class="oi">${saudacao()}${S.admin ? ', gerente' : ''}!</div><div class="dt">${dt}</div>${extra || ''}</div>`;

    if (!S.admin){ app.innerHTML = hero() + atalhos + (S.mode === 'db' ? `<p class="mut" style="text-align:center"><a href="#" onclick="document.getElementById('modeBadge').click();return false" style="color:var(--mut)">Entrar como gerente</a></p>` : ''); return; }

    assinarMes(); assinar(); assinarHorti(); carregarProdutos();
    // Be Honest: pick list mais recente
    const ps = [...S.pedidos.values()];
    const dia = ps.map(p => (p.criadoEm || '').slice(0, 10)).sort().pop() || '';
    const doDia = ps.filter(p => (p.criadoEm || '').slice(0, 10) === dia);
    const st = {separando: 0, aguardando: 0, liberado: 0}; let cobrar = 0;
    doDia.forEach(p => { try{ st[statusPedido(p)]++; cobrar += valorPedido(p).liq || 0; }catch(e){} });
    // Baixas do mês
    const mes = [...BX.mes.values()];
    const val = b => custoDe(b) * b.qtd;
    const perda = mes.filter(b => b.tipo === 'PERDA'), uso = mes.filter(b => b.tipo === 'USO');
    const soma = a => a.reduce((s, b) => s + val(b), 0);
    const venc = soma(perda.filter(b => b.motivo === 'VENCIDO')), dan = soma(perda.filter(b => b.motivo === 'DANIFICADO'));
    const pend = [...BX.pend.values()];
    // Perda por dia
    const hojeD = new Date(); const nDias = new Date(hojeD.getFullYear(), hojeD.getMonth() + 1, 0).getDate();
    const porDia = Array(nDias).fill(0); perda.forEach(b => { porDia[+b.criadoEm.slice(8, 10) - 1] += val(b) || 0; });
    const mx = Math.max(...porDia, 1);
    // Top 5 perdas
    const tp = {}; perda.forEach(b => { const k = b.cod || b.desc; (tp[k] ||= {desc: b.desc, v: 0, q: 0, un: b.un}); tp[k].v += val(b); tp[k].q += b.qtd; });
    const top = Object.values(tp).sort((a, b) => b.v - a.v || b.q - a.q).slice(0, 5); const tmx = Math.max(...top.map(t => t.v), 1);
    const semCusto = mes.filter(b => !custoDe(b)).length;
    const mesNome = hojeD.toLocaleDateString('pt-BR', {month: 'long'});

    app.innerHTML = hero(pend.length ? `<div class="pill" onclick="go('baixas')">⚠ ${pend.length} baixa(s) para lançar no Avanço</div>` : '') + `
      <div class="kpis4">
        <div class="kpi g"><div class="l">📦 Be Honest${dia ? ' · ' + dia.slice(8, 10) + '/' + dia.slice(5, 7) : ''}</div><div class="v">${doDia.length} pedido${doDia.length === 1 ? '' : 's'}</div>
          <div class="s">${st.separando} separando · ${st.aguardando} aguardando · ${st.liberado} liberado${st.liberado === 1 ? '' : 's'}</div></div>
        <div class="kpi y"><div class="l">💰 A cobrar</div><div class="v">${typeof brl === 'function' ? brl(cobrar) : real(cobrar)}</div><div class="s">pick list ${dia ? 'de ' + dia.slice(8, 10) + '/' + dia.slice(5, 7) : '—'}, já com desconto</div>${(()=>{ try{ const a = acumulado30(); return `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--line);font-size:13px;color:var(--mut)">No mês: <b style="color:var(--ink,#222)">${brl(a.T)}</b> · ${a.N} ped.</div>`; }catch(e){ return ''; } })()}</div>
        <div class="kpi"><div class="l">🗑️ Perda em ${mesNome}</div><div class="v">${real(venc + dan)}</div><div class="s">📅 Vencido ${real(venc)} · 💥 Danificado ${real(dan)}</div></div>
        <div class="kpi k"><div class="l">🧽 Uso e consumo</div><div class="v">${real(soma(uso))}</div><div class="s">${uso.length} lançamento${uso.length === 1 ? '' : 's'} em ${mesNome}</div></div>
      </div>` + atalhos + `
      <div class="card"><b>Perda por dia · ${mesNome}</b>
        <div class="lele-bars" role="img" aria-label="Perda em reais por dia do mês">${porDia.map((v, i) => `<div class="${i === hojeD.getDate() - 1 ? 'hj' : ''}" style="height:${Math.round(v / mx * 100)}%" title="Dia ${i + 1}: ${real(v)}"></div>`).join('')}</div>
        <div class="lele-ax"><span>1</span><span>${Math.ceil(nDias / 2)}</span><span>${nDias}</span></div>
        ${semCusto ? `<p class="mut" style="margin:8px 0 0;color:var(--amber)">${semCusto} lançamento(s) sem custo: importe a tabela de produtos do Avanço para os valores ficarem completos.</p>` : ''}
      </div>
      ` + cruzamentoHorti() + `
      <div class="card top5"><b>Produtos que mais perdemos em ${mesNome}</b>
        ${top.length ? top.map(t => `<div class="r"><span>${esc(t.desc)}</span><b>${t.v ? real(t.v) : fq(t.q, t.un)}</b><div class="b"><i style="width:${Math.round((t.v || 0) / tmx * 100)}%"></i></div></div>`).join('') : '<div class="mut" style="margin-top:6px">Nenhuma perda lançada este mês ainda.</div>'}
      </div>`;
  }

  function renderBaixas(app){
    $('#title').textContent = 'Perda e uso e consumo';
    carregarProdutos(); assinar();
    app.innerHTML = `
      <div class="tabs" id="bxTipo">
        <button data-t="PERDA" class="${BX.tipo === 'PERDA' ? 'on' : ''}" style="flex:1;font-size:16px;min-height:44px">🗑️ Perda</button>
        <button data-t="USO" class="${BX.tipo === 'USO' ? 'on' : ''}" style="flex:1;font-size:16px;min-height:44px">🧽 Uso e consumo</button>
      </div>
      <div id="bxMotivo"></div>
      <div class="scan">
        <div class="row" style="flex-wrap:nowrap">
          <input id="bxScan" inputmode="search" autocomplete="off" placeholder="Bipe ou digite código / nome" style="flex:1">
          <button onclick="abrirCamera()" style="min-width:56px;font-size:22px" aria-label="Câmera">📷</button>
        </div>
        <div id="scanMsg" class="msg"></div>
      </div>
      <div id="bxForm"></div>
      <div id="bxLista"></div>`;
    $('#bxTipo').onclick = e => { const t = e.target.closest('button')?.dataset.t; if (!t) return; BX.tipo = t; BX.grupo = ''; localStorage.setItem('bx.tipo', t); if (t === 'USO') BX.motivo = ''; render(); };
    const inp = $('#bxScan');
    inp.onkeydown = e => {
      if (e.key !== 'Enter') return;
      const v = inp.value.trim(); if (!v) return;
      if (/^\d+$/.test(v)){ inp.value = ''; BX.busca = ''; bxBipar(v); }
    };
    inp.oninput = () => { BX.busca = /^\d+$/.test(inp.value.trim()) ? '' : inp.value.trim(); renderForm(); };
    renderMotivo(); renderForm(); renderLista();
  }

  function renderMotivo(){
    const el = $('#bxMotivo'); if (!el) return;
    el.innerHTML = BX.tipo !== 'PERDA' ? '' : `<div class="row" style="margin-bottom:6px"><span class="mut">Motivo:</span>
      ${Object.entries(MOTIVOS).map(([k, v]) => `<button data-m="${k}" class="${BX.motivo === k ? 'pri' : ''}" style="flex:1;min-height:40px">${k === 'VENCIDO' ? '📅' : '💥'} ${v}</button>`).join('')}</div>`;
    el.onclick = e => { const m = e.target.closest('button')?.dataset.m; if (!m) return; BX.motivo = m; renderMotivo(); };
  }

  function renderForm(){
    const el = $('#bxForm'); if (!el) return;
    const p = BX.prod;
    if (p){
      el.innerHTML = `<div class="card" style="border:2px solid var(--blue)">
        ${p.novo ? `<input id="bxDesc" placeholder="Nome do produto" style="width:100%;font-size:17px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);margin-bottom:6px">
          <div class="row"><span class="mut">Vendido por:</span><button id="bxUnUN" class="${p.un !== 'KG' ? 'pri' : ''}" style="min-height:36px">Unidade</button><button id="bxUnKG" class="${p.un === 'KG' ? 'pri' : ''}" style="min-height:36px">Quilo</button></div>`
        : `<div style="font-weight:700;font-size:17px">${esc(p.desc)}</div><div class="mut">Cód. ${esc(p.cod)}${p.ean ? ' · ' + esc(p.ean) : ''}</div>`}
        <div class="row" style="margin-top:10px;flex-wrap:nowrap">
          <input id="bxQtd" type="text" inputmode="decimal" placeholder="${p.un === 'KG' ? 'Peso em kg (ex.: 1,250)' : 'Quantidade'}" style="flex:1;font-size:22px;padding:12px;border-radius:12px;border:2px solid var(--green);background:var(--card);color:var(--ink);min-width:0">
          <b style="font-size:18px">${p.un === 'KG' ? 'kg' : 'un'}</b>
        </div>
        <div class="mut" style="margin-top:6px">${BX.tipo === 'PERDA' ? 'Perda' + (BX.motivo ? ' · ' + MOTIVOS[BX.motivo] : ' · <span style="color:var(--red)">escolha o motivo acima</span>') : 'Uso e consumo'}</div>
        <div class="row" style="margin-top:10px"><button onclick="BX.cancelar()" style="flex:1">Cancelar</button><button class="pri" id="bxSalvar" style="flex:2">Salvar</button></div>
      </div>`;
      $('#bxSalvar').onclick = salvar;
      $('#bxQtd').onkeydown = e => { if (e.key === 'Enter') salvar(); };
      if (p.novo){ $('#bxUnUN').onclick = () => { p.un = 'UN'; renderForm(); }; $('#bxUnKG').onclick = () => { p.un = 'KG'; renderForm(); }; }
      return;
    }
    // Busca por nome
    if (BX.busca.length >= 2){
      const base = BX.prods && BX.prods.length ? BX.prods : RAPIDOS;
      const achados = buscarNome(BX.busca, base, 25);
      el.innerHTML = `<div class="card" style="padding:6px">${achados.length ? achados.map((p, i) => `<div class="row" data-i="${i}" style="padding:10px 8px;border-bottom:1px solid var(--line);cursor:pointer;flex-wrap:nowrap"><span style="flex:1">${esc(p.desc)}</span><span class="mut">${esc(p.cod)}</span></div>`).join('')
        : `<div class="mut" style="padding:10px">Nada encontrado.${BX.prods && BX.prods.length ? '' : ' A tabela de produtos ainda não foi importada: só aparecem hortifruti, açougue e padaria.'}</div>`}
        <div style="padding:8px"><button onclick="BX.semCadastro()" style="width:100%">Não achei — lançar com o nome digitado</button></div></div>`;
      el.querySelectorAll('[data-i]').forEach(r => r.onclick = () => { $('#bxScan').value = ''; escolher(achados[+r.dataset.i]); });
      return;
    }
    // Botões rápidos (sem código de barras)
    const GR = BX.tipo === 'USO' ? GRUPOS_USO : GRUPOS;
    if (!GR[BX.grupo]) BX.grupo = BX.tipo === 'USO' ? 'L' : '';
    const g = BX.grupo;
    el.innerHTML = `<div class="cat">${BX.tipo === 'USO' ? 'Mais usados na loja' : 'Sem código de barras'}</div>
      <div class="tabs">${Object.entries(GR).map(([k, v]) => `<button data-g="${k}" class="${g === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      ${g ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px">${RAPIDOS.filter(p => p.g === g).map(p => `<button data-c="${p.cod}" style="text-align:left;font-size:14px;min-height:48px">${esc(p.desc.replace(/ (KG|BDJ?|UN|PCT)$/, ''))}</button>`).join('')}</div>` : ''}`;
    el.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { BX.grupo = (BX.grupo === b.dataset.g && BX.tipo !== 'USO') ? '' : b.dataset.g; renderForm(); });
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const r = RAPIDOS.find(x => x.cod === b.dataset.c); { const t = BX.porCod.get(r.cod) || {}; escolher({...r, ...t, custo: t.custo || r.custo}); } });
  }

  function renderLista(){
    const el = $('#bxLista'); if (!el) return;
    const todas = [...BX.pend.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    const minhas = S.admin ? todas : todas.filter(b => b.func === BX.func && b.criadoEm.slice(0, 10) === hoje());
    let h = '';
    if (S.admin){
      const tot = t => todas.filter(b => b.tipo === t).reduce((a, b) => [a[0] + 1, a[1] + custoDe(b) * b.qtd], [0, 0]);
      const [nP, vP] = tot('PERDA'), [nU, vU] = tot('USO');
      const semCod = todas.filter(b => b.fora || (!b.cod && !b.ean)).length;
      h += `<div class="card"><b>Pendentes de lançar no Avanço</b>
        <table style="margin-top:6px"><tr><th>Tipo</th><th class="num">Itens</th><th class="num">Custo aprox.</th></tr>
        <tr><td>Perda</td><td class="num">${nP}</td><td class="num">${real(vP)}</td></tr>
        <tr><td>Uso e consumo</td><td class="num">${nU}</td><td class="num">${real(vU)}</td></tr></table>
        ${semCod ? `<p class="mut" style="color:var(--amber);margin:6px 0 0">⚠ ${semCod} fora da tabela de produtos (conferir no lançamento).</p>` : ''}
        <div class="row" style="margin-top:8px;justify-content:space-between"><span class="mut">Tabela de produtos: <b>${BX.prods ? BX.prods.length : '…'}</b></span>
        <button onclick="BX.importar()" style="min-height:36px;padding:6px 12px;font-size:14px">Importar produtos do Avanço</button></div></div>`;
    }
    h += `<div class="cat">${S.admin ? 'Todas as pendentes' : 'Seus lançamentos de hoje'}</div>`;
    if (!minhas.length) h += `<div class="mut" style="padding:8px 2px">Nenhum ainda.</div>`;
    h += minhas.map(b => `<div class="item ${b.tipo === 'PERDA' ? 'falta' : 'and'}">
      <div><div class="d">${esc(b.desc)}</div>
      <div class="e">${fq(b.qtd, b.un)} · ${b.tipo === 'PERDA' ? 'Perda · ' + (MOTIVOS[b.motivo] || '') : 'Uso e consumo'}${S.admin ? ' · ' + esc(b.func) + ' · ' + b.criadoEm.slice(8, 10) + '/' + b.criadoEm.slice(5, 7) : ' · ' + b.criadoEm.slice(11, 16)}${b.fora ? ' · <span style="color:var(--amber)">fora da tabela</span>' : ''}</div></div>
      <button class="ghost" onclick="BX.apagar('${b.id}')" aria-label="Apagar" style="color:var(--red)">✕</button></div>`).join('');
    if (!S.admin) h += `<p class="mut" style="text-align:center;margin-top:14px">Lançando como <b>${esc(BX.func || '—')}</b> · <a href="#" onclick="BX.trocarNome();return false" style="color:var(--blue)">trocar</a></p>`;
    el.innerHTML = h;
  }


  /* ---------- Recebimento do hortifruti (pesagem na chegada, login por PIN) ---------- */
  const HZ = {sess: null, pins: [], mes: new Map(), subMes: null, subPins: null, prod: null, busca: '', pin: ''};
  window.HZ = HZ;
  try{ const ss = JSON.parse(localStorage.getItem('hz.sess') || 'null'); if (ss && Date.now() - ss.t < 12 * 3600e3) HZ.sess = ss; }catch(e){}
  const hashPin = async pin => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('lele-horti:' + pin)))].map(b => b.toString(16).padStart(2, '0')).join('');
  function assinarHorti(){
    if (!S.db) return;
    if (!HZ.subPins){ HZ.subPins = true; HZ.subPins = S.db.collection('config').doc('pinsHorti').onSnapshot(d => { HZ.pins = (d.exists && d.data().lista) || []; if (S.view === 'horti') render(); }, () => {}); }
    if (!HZ.subMes){ HZ.subMes = true; HZ.subMes = S.db.collection('hortiEntradas').where('criadoEm', '>=', inicioMes()).onSnapshot(snap => {
      HZ.mes = new Map(snap.docs.map(d => [d.id, {id: d.id, ...d.data()}]));
      if (S.view === 'horti' || S.view === 'menu') render();
    }, e => toast('Erro ao ler pesagens: ' + e.message, 'err')); }
  }
  const quem = () => HZ.sess ? HZ.sess.nome : (S.admin ? 'Gerente' : '');

  async function digitarPin(d){
    if (d === 'C'){ HZ.pin = ''; } else if (d === '<'){ HZ.pin = HZ.pin.slice(0, -1); } else if (HZ.pin.length < 4) HZ.pin += d;
    const el = $('#hzDots'); if (el) el.textContent = '●'.repeat(HZ.pin.length) + '○'.repeat(4 - HZ.pin.length);
    if (HZ.pin.length === 4){
      const h = await hashPin(HZ.pin); HZ.pin = '';
      const p = HZ.pins.find(x => x.hash === h);
      if (!p){ toast('PIN incorreto.', 'err'); try{ beep(false); }catch(e){} render(); return; }
      HZ.sess = {nome: p.nome, t: Date.now()}; localStorage.setItem('hz.sess', JSON.stringify(HZ.sess)); render();
    }
  }

  async function salvarPesagem(){
    const p = HZ.prod; if (!p) return;
    const qtd = num($('#hzQtd')?.value);
    if (!(qtd > 0)){ toast('Digite o peso.', 'err'); return; }
    if (p.un !== 'KG' && qtd % 1){ toast('Este produto é por unidade/bandeja: use número inteiro.', 'err'); return; }
    const btn = $('#hzSalvar'); if (btn) btn.disabled = true;
    try{
      await S.db.collection('hortiEntradas').add({cod: p.cod || '', ean: p.ean || '', desc: p.desc, un: p.un || 'KG', qtd: +qtd.toFixed(3), custo: p.custo || 0, func: quem(), criadoEm: new Date().toISOString()});
      toast('Pesagem salva: ' + p.desc + ' · ' + fq(qtd, p.un), 'ok'); HZ.prod = null; render();
    }catch(e){ toast('Não salvou: ' + e.message, 'err'); if (btn) btn.disabled = false; }
  }

  function renderHorti(app){
    $('#title').textContent = 'Recebimento hortifruti';
    carregarProdutos(); assinarHorti();
    if (!HZ.sess && !S.admin){
      app.innerHTML = `<div class="card" style="text-align:center;max-width:340px;margin:20px auto">
        <div style="font-size:34px">🥬</div><b style="font-size:18px">Digite seu PIN</b>
        <div id="hzDots" style="font-size:30px;letter-spacing:10px;margin:12px 0">○○○○</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${['1','2','3','4','5','6','7','8','9','C','0','<'].map(k => `<button data-k="${k}" style="font-size:24px;min-height:60px">${k === '<' ? '⌫' : k}</button>`).join('')}</div>
        ${!HZ.pins.length ? '<p class="mut" style="margin-top:12px">Nenhum PIN cadastrado ainda. O gerente cadastra nesta mesma tela.</p>' : ''}</div>`;
      app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => digitarPin(b.dataset.k));
      return;
    }
    const hj = hoje();
    const doDia = [...HZ.mes.values()].filter(e => e.criadoEm.slice(0, 10) === hj).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    const tot = {}; doDia.forEach(e => { const k = e.cod || e.desc; (tot[k] ||= {desc: e.desc, un: e.un, q: 0}); tot[k].q += e.qtd; });
    let h = `<div class="row" style="margin-bottom:8px"><span class="mut" style="flex:1">Pesando como <b>${esc(quem())}</b></span>${HZ.sess ? `<button onclick="HZ.sair()" style="min-height:36px;padding:6px 12px;font-size:14px">Sair</button>` : ''}</div>`;
    if (HZ.prod){
      const p = HZ.prod;
      h += `<div class="card" style="border:2px solid var(--green)"><div style="font-weight:700;font-size:18px">${esc(p.desc)}</div><div class="mut">Cód. ${esc(p.cod || p.ean)}</div>
        <div class="row" style="margin-top:10px;flex-wrap:nowrap"><input id="hzQtd" inputmode="decimal" placeholder="${p.un === 'KG' ? 'Peso na balança (ex.: 22,350)' : 'Quantidade'}" style="flex:1;min-width:0;font-size:24px;padding:12px;border-radius:12px;border:2px solid var(--green);background:var(--card);color:var(--ink)"><b style="font-size:18px">${p.un === 'KG' ? 'kg' : 'un'}</b></div>
        <div class="row" style="margin-top:10px"><button onclick="HZ.cancelar()" style="flex:1">Cancelar</button><button class="pri" id="hzSalvar" style="flex:2">Salvar pesagem</button></div></div>`;
    } else {
      h += `<input id="hzBusca" inputmode="search" autocomplete="off" placeholder="Buscar outro produto pelo nome ou código" value="${esc(HZ.busca)}" style="width:100%;font-size:17px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);margin-bottom:8px">`;
      if (HZ.busca.length >= 2){
        const base = BX.prods && BX.prods.length ? BX.prods : RAPIDOS;
        const ach = /^\d+$/.test(HZ.busca) ? [acharProduto(HZ.busca)].filter(Boolean) : buscarNome(HZ.busca, base, 20);
        h += `<div class="card" style="padding:6px">${ach.length ? ach.map((p, i) => `<div class="row" data-a="${i}" style="padding:10px 8px;border-bottom:1px solid var(--line);cursor:pointer;flex-wrap:nowrap"><span style="flex:1">${esc(p.desc)}</span><span class="mut">${esc(p.cod)}</span></div>`).join('') : '<div class="mut" style="padding:8px">Nada encontrado.</div>'}</div>`;
        HZ._ach = ach;
      } else {
        h += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">${RAPIDOS.filter(p => p.g === 'H').map(p => `<button data-c="${p.cod}" style="text-align:left;font-size:14px;min-height:52px">${esc(p.desc.replace(/ (KG|BDJ?|UN)$/, ''))}</button>`).join('')}</div>`;
      }
    }
    h += `<div class="cat">Recebido hoje</div>`;
    const tl = Object.values(tot);
    h += tl.length ? `<div class="card" style="padding:8px 10px"><table>${tl.map(t => `<tr><td>${esc(t.desc)}</td><td class="num"><b>${fq(t.q, t.un)}</b></td></tr>`).join('')}</table></div>` : '<div class="mut" style="padding:6px 2px">Nenhuma pesagem hoje.</div>';
    h += doDia.map(e => `<div class="item and"><div><div class="d">${esc(e.desc)}</div><div class="e">${fq(e.qtd, e.un)} · ${esc(e.func)} · ${e.criadoEm.slice(11, 16)}</div></div>
      ${(S.admin || e.func === quem()) ? `<button class="ghost" onclick="HZ.apagar('${e.id}')" style="color:var(--red)" aria-label="Apagar">✕</button>` : '<span></span>'}</div>`).join('');
    if (S.admin){
      h += `<div class="card" style="margin-top:14px"><b>Conferentes com PIN</b>
        ${HZ.pins.length ? `<table style="margin-top:6px">${HZ.pins.map((p, i) => `<tr><td>${esc(p.nome)}</td><td class="num"><button class="ghost" onclick="HZ.removerPin(${i})" style="color:var(--red);min-height:32px">Remover</button></td></tr>`).join('')}</table>` : '<div class="mut" style="margin:6px 0">Nenhum cadastrado.</div>'}
        <div class="row" style="margin-top:8px;flex-wrap:nowrap"><input id="hzNome" placeholder="Nome" style="flex:2;min-width:0;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)">
        <input id="hzPin" inputmode="numeric" maxlength="4" placeholder="PIN" style="flex:1;min-width:0;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)">
        <button class="pri" onclick="HZ.addPin()" style="min-height:40px">Adicionar</button></div></div>`;
    }
    app.innerHTML = h;
    if (HZ.prod){ $('#hzSalvar').onclick = salvarPesagem; const q = $('#hzQtd'); q.onkeydown = e => { if (e.key === 'Enter') salvarPesagem(); }; setTimeout(() => q.focus(), 50); return; }
    const bu = $('#hzBusca'); bu.oninput = () => { HZ.busca = bu.value.trim(); render(); const n = $('#hzBusca'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    app.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const r = RAPIDOS.find(x => x.cod === b.dataset.c); HZ.prod = {...r, ...(BX.porCod.get(r.cod) || {})}; render(); });
    app.querySelectorAll('[data-a]').forEach(r => r.onclick = () => { HZ.prod = {...HZ._ach[+r.dataset.a]}; HZ.busca = ''; render(); });
  }

  HZ.sair = () => { HZ.sess = null; localStorage.removeItem('hz.sess'); render(); };
  HZ.cancelar = () => { HZ.prod = null; render(); };
  HZ.apagar = id => { const e = HZ.mes.get(id); if (e && confirm('Apagar ' + e.desc + ' (' + fq(e.qtd, e.un) + ')?')) S.db.collection('hortiEntradas').doc(id).delete().catch(er => toast('Não apagou: ' + er.message, 'err')); };
  HZ.addPin = async () => {
    const nome = $('#hzNome').value.trim(), pin = $('#hzPin').value.trim();
    if (!nome || !/^\d{4}$/.test(pin)){ toast('Digite o nome e um PIN de 4 números.', 'err'); return; }
    const hash = await hashPin(pin);
    if (HZ.pins.some(p => p.hash === hash)){ toast('Esse PIN já é de outra pessoa. Escolha outro.', 'err'); return; }
    await S.db.collection('config').doc('pinsHorti').set({lista: [...HZ.pins, {nome, hash}]}).then(() => toast('PIN de ' + nome + ' cadastrado.', 'ok')).catch(e => toast('Erro: ' + e.message, 'err'));
  };
  HZ.removerPin = i => { const p = HZ.pins[i]; if (!confirm('Remover o PIN de ' + p.nome + '?')) return; S.db.collection('config').doc('pinsHorti').set({lista: HZ.pins.filter((_, j) => j !== i)}); };

  // Recebido x perdido no mês (painel do gerente)
  function cruzamentoHorti(){
    const rec = {};
    [...HZ.mes.values()].forEach(e => { const k = e.cod || e.desc; (rec[k] ||= {desc: e.desc, un: e.un, r: 0, p: 0, custo: 0}); rec[k].r += e.qtd; const c = custoDe(e); if (c) rec[k].custo = c; });
    [...BX.mes.values()].filter(b => b.tipo === 'PERDA').forEach(b => { const k = b.cod || b.desc; if (rec[k]){ rec[k].p += b.qtd; if (!rec[k].custo && custoDe(b)) rec[k].custo = custoDe(b); } });
    const lin = Object.values(rec).map(x => ({...x, pct: x.r ? x.p / x.r * 100 : 0})).sort((a, b) => b.pct - a.pct);
    if (!lin.length) return `<div class="card"><b>🥬 Hortifruti · recebido x perdido</b><div class="mut" style="margin-top:6px">Ainda não há pesagens de recebimento este mês.</div></div>`;
    const cor = p => p >= 10 ? 'var(--red)' : p >= 5 ? 'var(--amber)' : 'var(--green)';
    return `<div class="card"><b>🥬 Hortifruti · recebido x perdido no mês</b>
      <table style="margin-top:6px"><tr><th>Produto</th><th class="num">Recebido</th><th class="num">Perdido</th><th class="num">% perda</th><th class="num">Custo real</th></tr>
      ${lin.slice(0, 12).map(x => `<tr><td>${esc(x.desc.replace(/ KG$/, ''))}</td><td class="num">${fq(x.r, x.un)}</td><td class="num">${fq(x.p, x.un)}</td><td class="num"><b style="color:${cor(x.pct)}">${x.pct.toFixed(1).replace('.', ',')}%</b></td><td class="num">${x.custo ? real(x.custo / Math.max(0.01, 1 - x.pct / 100)) + (x.un === 'KG' ? '/kg' : '') : '—'}</td></tr>`).join('')}</table>
      <p class="mut" style="margin:8px 0 0">${BX.custoHortiEm ? 'Custo do hortifruti atualizado pela CEASA em ' + BX.custoHortiEm.slice(8, 10) + '/' + BX.custoHortiEm.slice(5, 7) + '. ' : ''}Custo real = custo ÷ (1 − % de perda): é o quanto cada kg vendido realmente custa. <span style="color:var(--red)">Vermelho</span> (10% ou mais) indica que vale rever o preço ou a compra.</p></div>`;
  }

  /* ---------- Ações chamadas pelo HTML ---------- */
  BX.cancelar = () => { BX.prod = null; renderForm(); $('#bxScan')?.focus(); };
  BX.semCadastro = () => { const n = $('#bxScan').value.trim(); $('#bxScan').value = ''; escolher({cod: '', ean: '', desc: '', un: 'UN', custo: 0, novo: true}); setTimeout(() => { const d = $('#bxDesc'); if (d){ d.value = n.toUpperCase(); } }, 70); };
  BX.apagar = apagar;
  BX.carregarProdutos = carregarProdutos;
  BX.trocarNome = () => { const n = prompt('Seu nome:', BX.func); if (n && n.trim()){ BX.func = n.trim(); localStorage.setItem('bx.func', BX.func); renderLista(); } };
  BX.importar = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx,.xls,.csv'; i.onchange = () => i.files[0] && importarProdutos(i.files[0]).catch(e => toast('Erro ao importar: ' + e.message, 'err')); i.click(); };

  /* ---------- Encaixe no app de separação ---------- */
  const renderOrig = render, biparOrig = bipar;
  render = function(){
    const app = $('#app');
    if (S.view === 'menu'){ $('#back').classList.add('hide'); return renderMenu(app); }
    if (S.view === 'baixas'){ $('#back').classList.remove('hide'); return renderBaixas(app); }
    if (S.view === 'horti'){ $('#back').classList.remove('hide'); return renderHorti(app); }
    const r = renderOrig.apply(this, arguments);
    if (S.view === 'inicio') $('#back').classList.remove('hide');
    return r;
  };
  bipar = function(code){ return S.view === 'baixas' ? bxBipar(code) : biparOrig.apply(this, arguments); };
  $('#back').onclick = () => go(['inicio', 'baixas', 'horti'].includes(S.view) ? 'menu' : 'inicio');

  // Abre no menu (ou direto em "baixas" com o link .../#baixas)
  if (S.view === 'inicio' && !/shared=1/.test(location.search)) S.view = location.hash === '#baixas' ? 'baixas' : location.hash === '#horti' ? 'horti' : 'menu';
  render();
})();
