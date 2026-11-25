/* =====================================================================
   Lelê Supermercados — Validade (controle de vencimento na gôndola)
   Módulo extra do app. Carregado depois de contagem.js:
   <script src="validade.js"></script>

   - Aba separada de Perda e Uso e consumo: aqui NÃO se lança baixa.
   - Equipe, na reposição: bipa ou busca o produto, informa a data do
     lote mais próximo de vencer e a quantidade na loja.
   - Lista ordenada pelo vencimento, com a ação sugerida:
       vencido ............ retirar (e lançar a perda na aba Perda)
       até 3 dias ......... vender a preço de custo
       4 a 7 dias ......... 30% de desconto
       8 a 15 dias ........ 15% de desconto
       mais de 15 dias .... só acompanhar
   - Botões "Vendeu" e "Retirei" tiram o item da lista. "Retirei" oferece
     abrir a aba Perda, onde a baixa é lançada normalmente.
   - Link direto: .../#validade
   - Dados: coleção "validade" (status ativo / vendido / retirado).
   ===================================================================== */
(function(){
  if (typeof S === 'undefined' || typeof render !== 'function') return;

  const VD = {
    itens: new Map(), sub: null, filtro: 'atencao', prod: null, busca: '', via: '', aviso: ''
  };
  window.VD = VD;

  const num = v => { const n = parseFloat(String(v ?? '').trim().replace(',', '.')); return isFinite(n) ? n : NaN; };
  const fmt = n => n == null || isNaN(n) ? '—' : String(+(+n).toFixed(3)).replace('.', ',');
  const real = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const dig = s => String(s || '').replace(/\D/g, '');
  const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const diasAte = iso => { const [a, m, d] = iso.split('-').map(Number); const h = new Date(); return Math.round((new Date(a, m - 1, d) - new Date(h.getFullYear(), h.getMonth(), h.getDate())) / 864e5); };
  const dataBR = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(2, 4) : '';
  const custoDe = it => { try{ const p = window.BX && BX.porCod && it.cod && BX.porCod.get(it.cod); return (p && p.custo) || it.custo || 0; }catch(e){ return it.custo || 0; } };
  const quem = () => {
    if (S.admin) return 'Gerente';
    let n = (window.BX && BX.func) || localStorage.getItem('bx.func') || '';
    if (!n){ n = (prompt('Seu nome (fica salvo neste celular):', '') || '').trim(); if (!n) return ''; localStorage.setItem('bx.func', n); if (window.BX) BX.func = n; }
    return n;
  };

  // Faixa de ação pelo número de dias até vencer
  function acao(dias, custo){
    if (dias < 0)   return {k: 0, cor: 'var(--red)',   bg: '#fdecec', t: 'VENCIDO · retirar da gôndola', s: 'Retire e lance a perda na aba Perda.'};
    if (dias <= 3)  return {k: 1, cor: 'var(--red)',   bg: '#fdecec', t: 'Vender a preço de custo', s: custo ? 'Custo ' + real(custo) : 'Vender pelo custo do sistema.'};
    if (dias <= 7)  return {k: 2, cor: '#c2410c',      bg: '#fff1e6', t: '30% de desconto', s: 'Separar em ponta de gôndola com etiqueta.'};
    if (dias <= 15) return {k: 3, cor: 'var(--amber)', bg: 'var(--amber-bg)', t: '15% de desconto', s: 'Colocar na frente e oferecer.'};
    return {k: 4, cor: 'var(--green)', bg: '#e3f3ea', t: 'OK · só acompanhar', s: ''};
  }

  /* ---------- Dados ---------- */
  function assinar(){
    if (VD.sub || !S.db || !S.uid) return;
    const aplicar = snap => { snap.docChanges().forEach(ch => { if (ch.type === 'removed'){ const x = VD.itens.get(ch.doc.id); if (x && x.status === ch.doc.data().status) VD.itens.delete(ch.doc.id); } else VD.itens.set(ch.doc.id, {id: ch.doc.id, ...ch.doc.data()}); }); VD.aviso = ''; redesenhar(); };
    const erro = e => { VD.sub = null; VD.aviso = 'Não consegui ler a lista de validade (' + (e.code || e.message) + '). Se aparecer "permission-denied", falta publicar a regra "validade" no Firebase.'; redesenhar(); };
    const desde = new Date(Date.now() - 30 * 864e5).toISOString();
    // ativos: todos, de qualquer data · encerrados: só os últimos 30 dias
    VD.sub = [S.db.collection('validade').where('status', '==', 'ativo').onSnapshot(aplicar, erro),
              S.db.collection('validade').where('fimEm', '>=', desde).onSnapshot(aplicar, erro)];
  }
  const ativos = () => [...VD.itens.values()].filter(i => i.status === 'ativo').sort((a, b) => a.venc.localeCompare(b.venc) || a.desc.localeCompare(b.desc));
  function resumo(){
    const r = {venc: 0, d3: 0, d7: 0, d15: 0, total: 0};
    for (const i of ativos()){ const d = diasAte(i.venc); r.total++; if (d < 0) r.venc++; else if (d <= 3) r.d3++; else if (d <= 7) r.d7++; else if (d <= 15) r.d15++; }
    return r;
  }

  /* ---------- Bipar / buscar ---------- */
  function vdMsg(t, kind){ const m = $('#scanMsg'); if (m){ m.className = 'msg ' + kind; m.textContent = t; } }
  async function achar(code){
    if (!window.BX) return null;
    if ((!BX.prods || !BX.prods.length) && typeof BX.carregarProdutos === 'function'){ vdMsg('Procurando no cadastro de produtos…', 'warn'); try{ await BX.carregarProdutos(true); }catch(e){} }
    const c = dig(code);
    if (c.length <= 6) return BX.porCod.get(c) || BX.porCod.get(String(+c)) || null;
    return BX.porEan.get(c.replace(/^0+/, '')) || null;
  }
  async function vdBipar(code, via){
    const camAberta = !!$('#cam');
    if (camAberta && typeof fecharCamera === 'function') fecharCamera();
    VD.via = via || (camAberta ? 'cam' : 'leitor');
    const p = await achar(code);
    if (!p){ try{ beep(false); }catch(e){} vdMsg('Código ' + code + ' não está no cadastro do app. Busque pelo nome ou toque em "Sem cadastro".', 'warn'); return; }
    try{ beep(true); }catch(e){}
    vdMsg('✓ ' + p.desc, 'ok'); escolher(p);
  }
  function escolher(p){
    VD.prod = {cod: p.cod || '', ean: p.ean || '', desc: p.desc || '', un: p.un || 'UN', custo: p.custo || 0, novo: !!p.novo};
    VD.busca = ''; const s = $('#vdScan'); if (s) s.value = '';
    desenharSug(); desenharForm();
    setTimeout(() => { const d = $('#vdData'); if (d) d.focus(); }, 60);
  }
  function sugestoes(){
    if (!VD.busca || VD.busca.length < 2 || !window.BX || !BX.prods) return [];
    const t = VD.busca.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean), q = t.join(' ');
    const nota = p => p.desc === q ? 0 : p.desc.startsWith(q) ? 1 : 2;
    return BX.prods.filter(p => t.every(x => p.desc.includes(x))).sort((a, b) => nota(a) - nota(b) || a.desc.length - b.desc.length).slice(0, 8);
  }

  /* ---------- Gravar ---------- */
  function salvar(){
    const p = VD.prod; if (!p) return;
    if (p.novo){ p.desc = ($('#vdDesc')?.value || '').trim().toUpperCase(); if (!p.desc){ toast('Digite o nome do produto.', 'err'); return; } }
    const venc = $('#vdData').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(venc)){ toast('Escolha a data de vencimento do lote mais próximo.', 'err'); return; }
    const d = diasAte(venc);
    if (d > 400 && !confirm('Vencimento daqui a ' + d + ' dias. A data está certa?')) return;
    const q = num($('#vdQtd').value);
    if (isNaN(q) || q <= 0){ toast('Digite quantas unidades tem na loja com essa data.', 'err'); return; }
    const func = quem(); if (!func) return;
    if (!S.db){ toast('Sem conexão com o banco: o app precisa estar ligado ao Firebase.', 'err'); return; }
    const agora = new Date().toISOString();
    // mesmo produto e mesma data já na lista: atualiza a quantidade em vez de duplicar
    const ja = ativos().find(i => i.venc === venc && ((p.cod && i.cod === p.cod) || (!p.cod && i.desc === p.desc)));
    const rec = {cod: p.cod, ean: p.ean, desc: p.desc, un: p.un, custo: p.custo || 0, venc, qtd: q, func, status: 'ativo', criadoEm: ja ? ja.criadoEm : agora, atualizadoEm: agora};
    const ref = ja ? S.db.collection('validade').doc(ja.id) : S.db.collection('validade').doc();
    ref.set(rec).then(() => {}).catch(e => toast('Não salvou: ' + (e.code || e.message), 'err'));
    VD.itens.set(ref.id, {id: ref.id, ...rec});
    const a = acao(d, custoDe(rec));
    toast((ja ? 'Atualizado: ' : 'Anotado: ') + p.desc + ' · vence ' + dataBR(venc) + ' · ' + a.t, d <= 7 ? 'warn' : 'ok');
    VD.prod = null; desenharForm(); desenharTopo(); desenharLista();
    if (VD.via === 'cam' && typeof abrirCamera === 'function') setTimeout(abrirCamera, 150);
    else setTimeout(() => $('#vdScan')?.focus(), 60);
  }
  function encerrar(id, status){
    const i = VD.itens.get(id); if (!i) return;
    const func = quem(); if (!func) return;
    const agora = new Date().toISOString();
    const fim = {status, fimEm: agora, fimPor: func};
    S.db.collection('validade').doc(id).update(fim).catch(e => toast('Não salvou: ' + (e.code || e.message), 'err'));
    VD.itens.set(id, {...i, ...fim});
    desenharTopo(); desenharLista();
    if (status === 'retirado') confirmar('Retirado: ' + i.desc + ' (' + fmt(i.qtd) + ' un). Lançar a perda agora na aba Perda?', 'Abrir Perda', () => { if (window.BX){ BX.tipo = 'PERDA'; BX.motivo = 'VENCIDO'; localStorage.setItem('bx.tipo', 'PERDA'); } go('baixas'); });
    else toast('Vendido: ' + i.desc + '. Saiu da lista.', 'ok');
  }

  /* ---------- Telas ---------- */
  const ESTILO = `
    .vd-top{background:linear-gradient(135deg,#7a1f5c,#4b1238);color:#fff;border-radius:16px;padding:14px 16px;margin-bottom:10px}
    .vd-top b.t{font-size:18px}.vd-top .s{font-size:14px;opacity:.92;margin-top:4px}
    .vd-k{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
    .vd-k div{background:rgba(255,255,255,.14);border-radius:10px;padding:6px;text-align:center;font-size:12px}.vd-k b{display:block;font-size:20px}
    .vd-it{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;border-left:6px solid var(--line)}
    .vd-it .d{font-weight:700;font-size:16px}.vd-it .m{font-size:13px;color:var(--mut)}
    .vd-ac{grid-column:1/-1;border-radius:10px;padding:8px 10px;font-size:14px}
    .vd-ac b{display:block;font-size:15px}
    .vd-bt{grid-column:1/-1;display:flex;gap:8px}.vd-bt button{flex:1;min-height:42px;font-size:15px}
    .vd-dias{font-size:22px;font-weight:800;text-align:right;line-height:1}.vd-dias small{display:block;font-size:11px;font-weight:600;color:var(--mut)}
    .vd-sug button{display:block;width:100%;text-align:left;margin-bottom:6px;font-size:15px}`;
  if (!document.getElementById('vdCss')){ const st = document.createElement('style'); st.id = 'vdCss'; st.textContent = ESTILO; document.head.appendChild(st); }

  function renderValidade(app){
    $('#title').textContent = 'Validade';
    assinar();
    if (window.BX && typeof BX.carregarProdutos === 'function') BX.carregarProdutos();
    app.innerHTML = `<div id="vdRoot"><div id="vdTop"></div>
      <div class="scan"><div class="row" style="flex-wrap:nowrap">
        <input id="vdScan" inputmode="search" autocomplete="off" placeholder="Bipe ou digite código / nome" style="flex:1">
        <button onclick="abrirCamera()" style="min-width:56px;font-size:22px" aria-label="Câmera">📷</button></div>
        <div id="scanMsg" class="msg"></div></div>
      <div id="vdSug" class="vd-sug"></div>
      <div id="vdForm"></div>
      <div class="tabs" id="vdFil">${[['atencao', '⚠ Atenção (até 15 dias)'], ['todos', 'Todos na loja'], ['fim', 'Vendidos / retirados']].map(([k, l]) => `<button data-f="${k}" class="${VD.filtro === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="vdLista"></div>
      <p class="mut" style="margin-top:14px">Na reposição, anote o lote que vence primeiro e quantas unidades tem com essa data. Esta aba não lança perda: se retirar o produto, lance a perda na aba <a href="#" onclick="go('baixas');return false" style="color:var(--blue)">Perda</a>.${S.admin ? '' : ' Anotando como <b>' + esc(localStorage.getItem('bx.func') || '—') + '</b> · <a href="#" onclick="VD.trocarNome();return false" style="color:var(--blue)">trocar</a>'}</p>
    </div>`;
    const inp = $('#vdScan');
    inp.onkeydown = e => { if (e.key !== 'Enter') return; const v = inp.value.trim(); if (!v) return; if (/^\d+$/.test(v)){ inp.value = ''; VD.busca = ''; desenharSug(); vdBipar(v, 'leitor'); } else { const s = sugestoes(); if (s.length) escolher(s[0]); } };
    inp.oninput = () => { VD.busca = /^\d+$/.test(inp.value.trim()) ? '' : inp.value.trim(); desenharSug(); };
    $('#vdFil').onclick = e => { const f = e.target.closest('button')?.dataset.f; if (!f) return; VD.filtro = f; $('#vdFil').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === f)); desenharLista(); };
    $('#vdLista').onclick = e => { const b = e.target.closest('button[data-acao]'); if (!b) return; const id = b.dataset.id, a = b.dataset.acao;
      if (a === 'vendido' || a === 'retirado') encerrar(id, a);
      else if (a === 'apagar'){ const i = VD.itens.get(id); confirmar('Apagar a anotação de ' + (i ? i.desc : '') + '? (use se foi anotado errado)', 'Apagar', () => { S.db.collection('validade').doc(id).delete().catch(er => toast('Não apagou: ' + (er.code || er.message), 'err')); VD.itens.delete(id); desenharTopo(); desenharLista(); }); }
    };
    desenharTopo(); desenharSug(); desenharForm(); desenharLista();
  }

  function desenharTopo(){
    const el = $('#vdTop'); if (!el) return;
    const r = resumo();
    el.innerHTML = `<div class="vd-top"><b class="t">📅 Controle de validade</b>
      <div class="s">${r.total} produto(s) anotados na loja</div>
      <div class="vd-k"><div><b>${r.venc}</b>vencidos</div><div><b>${r.d3}</b>até 3 dias</div><div><b>${r.d7}</b>4 a 7 dias</div><div><b>${r.d15}</b>8 a 15 dias</div></div></div>
      ${VD.aviso ? `<div class="msg warn" style="display:block;margin-bottom:10px">${esc(VD.aviso)}</div>` : ''}`;
  }
  function desenharSug(){
    const el = $('#vdSug'); if (!el) return;
    if (!VD.busca){ el.innerHTML = ''; return; }
    const L = sugestoes();
    el.innerHTML = (L.length ? L.map((p, k) => `<button data-k="${k}">${esc(p.desc)} <span class="mut">· ${esc(p.cod || p.ean)}</span></button>`).join('') : `<p class="mut">${window.BX && BX.prods ? 'Nada encontrado.' : 'Carregando o cadastro de produtos…'}</p>`)
      + `<button data-k="novo" style="color:var(--blue)">➕ Sem cadastro: anotar pelo nome</button>`;
    el.onclick = e => { const k = e.target.closest('button')?.dataset.k; if (k == null) return; if (k === 'novo'){ const n = VD.busca; escolher({desc: n.toUpperCase(), novo: true}); } else escolher(L[+k]); };
  }
  function desenharForm(){
    const el = $('#vdForm'); if (!el) return;
    const p = VD.prod; if (!p){ el.innerHTML = ''; return; }
    const ja = ativos().filter(i => (p.cod && i.cod === p.cod) || (!p.cod && i.desc === p.desc));
    el.innerHTML = `<div class="card" style="border:2px solid #7a1f5c">
      ${p.novo ? `<input id="vdDesc" value="${esc(p.desc)}" placeholder="Nome do produto" style="width:100%;font-weight:700;font-size:16px">` : `<div style="font-weight:700;font-size:17px">${esc(p.desc)}</div><div class="mut">Cód. ${esc(p.cod || '—')}${p.ean ? ' · ' + esc(p.ean) : ''}</div>`}
      ${ja.length ? `<div class="mut" style="margin-top:4px">Já anotado: ${ja.map(i => '<b>' + dataBR(i.venc) + '</b> (' + fmt(i.qtd) + ' un)').join(', ')}. Mesma data atualiza a quantidade.</div>` : ''}
      <label class="mut" style="display:block;margin-top:10px">Vence em (lote mais próximo)</label>
      <input id="vdData" type="date" min="${hojeISO().slice(0, 4) - 1}-01-01" style="width:100%;font-size:20px;font-weight:700;padding:10px;border-radius:12px;border:2px solid var(--line);background:var(--card);color:var(--ink)">
      <label class="mut" style="display:block;margin-top:8px">Quantas unidades com essa data</label>
      <div class="row" style="flex-wrap:nowrap"><input id="vdQtd" inputmode="decimal" placeholder="0" style="flex:1;min-width:0;font-size:24px;font-weight:800;text-align:center;padding:12px;border-radius:12px;border:2px solid var(--green);background:var(--card);color:var(--ink)"><b>${p.un === 'KG' ? 'kg' : 'un'}</b></div>
      <div class="row" style="margin-top:10px"><button onclick="VD.cancelar()" style="flex:1">Cancelar</button><button class="pri" id="vdSalvar" style="flex:2">${VD.via === 'cam' ? 'Salvar e bipar outro' : 'Salvar'}</button></div></div>`;
    $('#vdSalvar').onclick = salvar;
    el.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter'){ if (i.id === 'vdData') $('#vdQtd').focus(); else salvar(); } });
  }
  function desenharLista(){
    const el = $('#vdLista'); if (!el) return;
    if (VD.filtro === 'fim'){
      const L = [...VD.itens.values()].filter(i => i.status !== 'ativo').sort((a, b) => (b.fimEm || '').localeCompare(a.fimEm || ''));
      el.innerHTML = L.length ? `<div class="card" style="padding:6px 10px"><table><tr><th>Produto</th><th class="num">Venc.</th><th class="num">Qtd</th><th>Saída</th></tr>${L.map(i => `<tr><td>${esc(i.desc)}</td><td class="num">${dataBR(i.venc)}</td><td class="num">${fmt(i.qtd)}</td><td>${i.status === 'vendido' ? '✅ vendeu' : '🗑️ retirado'}<div class="mut" style="font-size:11px">${esc(i.fimPor || '')} · ${dataBR((i.fimEm || '').slice(0, 10))}</div></td></tr>`).join('')}</table></div>` : '<p class="mut">Nada encerrado nos últimos 30 dias.</p>';
      return;
    }
    let L = ativos();
    if (VD.filtro === 'atencao') L = L.filter(i => diasAte(i.venc) <= 15);
    if (!L.length){ el.innerHTML = `<p class="mut">${VD.filtro === 'atencao' ? 'Nenhum produto vencendo nos próximos 15 dias. 👍' : 'Nenhum produto anotado ainda.'}</p>`; return; }
    el.innerHTML = L.map(i => {
      const d = diasAte(i.venc), c = custoDe(i), a = acao(d, c);
      return `<div class="card vd-it" style="border-left-color:${a.cor}">
        <div><div class="d">${esc(i.desc)}</div><div class="m">Vence <b>${dataBR(i.venc)}</b> · ${fmt(i.qtd)} ${i.un === 'KG' ? 'kg' : 'un'}${i.cod ? ' · cód. ' + esc(i.cod) : ''} · ${esc(i.func || '')}</div></div>
        <div class="vd-dias" style="color:${a.cor}">${d < 0 ? Math.abs(d) : d}<small>${d < 0 ? 'dia(s) vencido' : d === 0 ? 'vence hoje' : 'dia(s)'}</small></div>
        <div class="vd-ac" style="background:${a.bg}"><b style="color:${a.cor}">${a.t}</b>${a.s ? esc(a.s) : ''}${c && a.k >= 2 && a.k <= 3 ? ' <span class="mut">· custo ' + real(c) + '</span>' : ''}</div>
        <div class="vd-bt"><button data-acao="vendido" data-id="${i.id}">✅ Vendeu</button><button data-acao="retirado" data-id="${i.id}">🗑️ Retirei</button>${S.admin ? `<button data-acao="apagar" data-id="${i.id}" style="flex:0 0 auto;padding:0 12px" aria-label="Apagar">✕</button>` : ''}</div></div>`;
    }).join('');
  }

  VD.cancelar = () => { VD.prod = null; desenharForm(); $('#vdScan')?.focus(); };
  VD.trocarNome = () => { const n = prompt('Seu nome:', localStorage.getItem('bx.func') || ''); if (n && n.trim()){ localStorage.setItem('bx.func', n.trim()); if (window.BX) BX.func = n.trim(); render(); } };

  /* ---------- Atalho na tela inicial (equipe e gerente) ---------- */
  function cartaoMenu(){
    const app = $('#app'); if (!app || app.querySelector('#vdAtalho')) return;
    const ats = app.querySelectorAll('.atalho'); if (!ats.length) return;
    assinar();
    const r = resumo(), urg = r.venc + r.d3;
    const d = document.createElement('div');
    d.className = 'card pedido atalho'; d.id = 'vdAtalho'; d.onclick = () => go('validade');
    d.innerHTML = `<div class="ic" style="background:#f6e6f0">📅</div>
      <div style="flex:1"><h3>Validade</h3><div class="mut">${r.total ? `${r.total} anotado(s) · ${urg ? `<b style="color:var(--red)">${urg} para agir já</b>` : 'nada urgente'} · ${r.d7 + r.d15} em 4–15 dias` : 'Anotar na reposição o lote que vence primeiro.'}</div></div><b style="font-size:22px;color:var(--mut)">›</b>`;
    const baixas = [...ats].find(a => /go\('baixas'\)/.test(a.getAttribute('onclick') || ''));
    (baixas || ats[ats.length - 1]).after(d);
  }

  function redesenhar(){
    if (S.view === 'menu'){ $('#vdAtalho')?.remove(); cartaoMenu(); return; }
    if (S.view !== 'validade' || !$('#vdRoot')) return;
    desenharTopo(); desenharLista();
  }

  /* ---------- Encaixe no app ---------- */
  const renderAnt = render, biparAnt = bipar, backAnt = $('#back').onclick;
  render = function(){
    if (S.view === 'validade'){
      $('#back').classList.remove('hide');
      if ($('#vdRoot') && VD.feito === S.admin){ return redesenhar(); }   // atualização de outro módulo: não apaga o que está sendo digitado
      VD.feito = S.admin;
      return renderValidade($('#app'));
    }
    VD.feito = null;
    const r = renderAnt.apply(this, arguments);
    if (S.view === 'menu') cartaoMenu();
    return r;
  };
  bipar = function(code){ return S.view === 'validade' ? vdBipar(code) : biparAnt.apply(this, arguments); };
  $('#back').onclick = () => S.view === 'validade' ? go('menu') : backAnt && backAnt();

  // Link direto .../#validade
  if (location.hash === '#validade' && !/shared=1/.test(location.search)) S.view = 'validade';
  render();
})();
