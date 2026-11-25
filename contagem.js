/* =====================================================================
   Lelê Supermercados — Contagem de estoque (itens defasados)
   Módulo extra do app. Carregado depois de baixas.js:
   <script src="contagem.js"></script>

   - Gerente: atalho "Contagem de estoque" no painel, com progresso.
   - Equipe: link direto .../#contagem. Bipa (leitor, câmera) ou busca o
     item e digita quanto tem (gôndola + depósito). Pode contar por fardo.
     A equipe NÃO vê o estoque do sistema (contagem às cegas).
   - Contagem compartilhada ao vivo (coleção "contagem" do Firestore).
   - Gerente, aba Resultado: sistema x contado, diferença e valor do ajuste,
     copiar #CONT (página de cotação), copiar para o inventário do Avanço,
     baixar planilha, importar nova lista, recomeçar.
   - Lista: config/contagemLista (gerente importa). Sem lista importada,
     usa a lista de 24/11 (209 itens: estoque negativo + alto suspeito).
   ===================================================================== */
(function(){
  if (typeof S === 'undefined' || typeof render !== 'function') return;

  const GR = {L: 'Limpeza', H: 'Higiene e beleza', B: 'Biscoitos, doces e salgadinhos', F: 'Frios e laticínios', M: 'Mercearia'};
  // cod|descrição|estoque no sistema|1 = urgente (está no pedido) · 2 = estoque alto suspeito|seção|EAN
  const PADRAO = {rodada: '2026-11-24', nome: 'Itens defasados de 24/11', itens: `25085|SABAO EM PO TIXAN 1,6KG MACIEZ CX|-33|1|L|7896098909775
102080|SABAO EM PO TIXAN YPE MACIEZ EMB ECONO 22KG|-77|1|L|7896098903933
1417|DETERG LIQ YPE 500ML NEUTRO|-21|1|L|7896098900208
97670|VELA ESTR ORIENTE 16 CORES|-21|1|L|7898153051061
24420|SABAO BAR YPE 180G NEUTRO|-520|1|L|7896098905913
24577|SAB FLOR DE YPE 85G ROSAS BRANCA E AVELA|-363|1|L|7896098902264
24562|SABAO EM BARRA YPE 800G 5X1 NEUTRO|-207|1|L|7896098905906
42390|AMACIANTE YPE 2L AZUL ACONCHEGO|-27|1|L|7896098902400
29947|AGUA SANIT Q BOA 1L|-45|1|L|7896083800018
95358|DET PO OMO 800G LAV PERF|-26|1|L|7891150064317
70671|VINAGRE CASTELO 750ML ALCOOL|-48|1|L|7896048200051
105630|GILLETE PRESTOBARBA CARVAO 3|-44|1|L|7500435245845
24959|SABAO EM PO SURF 16KG CUID DO COCO SCH|-15|1|L|7891150086821
96609|ESPONJA LIMP SCOTCH BRITE 3M MULTI USO|-193|1|L|7891040150021
4627|PILHA DURACELL AAA 4X1|-8|1|L|41333001098
107271|AMAC DOWNY 350ML BRISA DE VERAO|-1|1|L|7500435252942
25560|SABAO EM PO TIXAN 400G PRIMAVERA CX|-56|1|L|7896098909720
27944|COPO PL.FONPLAST TRANSP 300ML 100UN|-1|1|L|742832318976
24461|CIF CREMOSO 450 LIMPEZA PROF|-3|1|L|7891150022034
54798|INSET AER BAYGON 360ML ACAO TOTAL|-4|1|L|7894650003787
94584|LA ACO BOMBRIL 60G ECO|522|2|L|7891022868036
3124|ISQUEIRO BIC GRANDE|1636|2|L|70330909229
30900|TOALHA PAPEL SNOB CLASSICA 120FLS 2X1UN|66|2|L|7896110012148
96696|CARVAO LOBAO 5KG|138|2|L|7898401840058
31291|AGUA SANIT Q BOA 2L|52|2|L|7896083800025
2663|SODA CAUSTICA SOL 1KG|65|2|L|7897323600146
100503|OMO LIQUIDO LAVAGEM PERFEITA DP 900ML|31|2|L|7891150064928
95357|PAPEL HIG PALOMA LV16 PG15 30M|-19|1|H|7896026800822
90769|MIST CONDENS TRIANGULO TP 395G|-211|1|H|7896434920778
93714|PAPEL HIG DUETTO FD 4X30M NEUTRO|-59|1|H|7896026850148
60658|CR DENTAL COLGATE T ACAO 180G|-45|1|H|7891024132371
6878|PRESTOBARBA GILLETTE CHAMPIONS|-361|1|H|7500435154772
1218|CR DENTAL COLGATE 50G MPA|-55|1|H|7891024132906
2182|LEITE COND NESTLE MOCA 395G|-84|1|H|7891000100103
42412|APAR BARBEAR PROBAK UN|-54|1|H|7702018118823
2102|CR DENTAL COLGATE TT12 90G ADVANCED FRES|-55|1|H|7891024135310
2104|CR DENTAL COLGATE TT12 90G WHITENIG|-57|1|H|7891024135020
1908|DES CREME HERBISSIMO 55G TRADIC|-4|1|H|7896049528512
7772|APAR BARBEAR PREST ULTRAGRIP UN|-1166|1|H|7500435154420
109407|GEL NYLOOKS AZUL MEGA FIX 240G|-13|1|H|7891350034950
109337|PRESTOBARBA GILLETTE ULTRAGRIP UN|-221|1|H|7500435154437
106472|APAR PRESTOB 3 1UN SUAVE|-18|1|H|7500435244688
26142|REFR EM PO FRESH 15G UVA|-84|1|H|7622210569943
26033|REFR FRESH 15G ABACAXI|-22|1|H|7622210570031
24576|SAB FLOR DE YPE 85G FLOR MACA E FRAMB|-462|1|H|7896098902233
100198|SABON.YPE BAUNILHA AMENDOA 85G|-341|1|H|7896098902271
34363|SABON DOVE 90G TRADICIONAL|-109|1|H|7898422746759
21872|SABON.YPE SUAVE GARDENIA E ARGAN 85GR|-324|1|H|7896098902219
99921|ABS ALWAYS NOTURNO SUAVE C/ABAS 8UNI|-3|1|H|7506339394603
95822|SABON LUX SUAVE 85G FLOR DE LOTUS|-3|1|H|7891150059924
21871|SABON.YPE SUAVE AG.COCO E ALECRIM 85GR|-223|1|H|7896098902257
93614|SABON LUX SUAVE 85G ORQUIDEA NEGRA|-104|1|H|7891150059900
24575|SAB FLOR DE YPE 85G FLOR LARANJ E DAMASCO|-284|1|H|7896098902240
21870|SABON.YPE SUAVE FRESIA E PESSEGO 85GR|-163|1|H|7896098902226
94164|DESOD AER REXONA 150ML ACTIVE EMOTION|-1|1|H|7791293032443
23670|DES CREME HERBISSIMO HIBISCO 55G|-6|1|H|7896049525726
113588|DES AER INVISIVEL MONANGE 200ML|-4|1|H|7896235354499
93745|PAPEL HIG PERSONAL VIP FD 4X30M NEUTRO|211|2|H|7896110000176
93415|CR DENTAL COLGATE TA 90G HORTELA|139|2|H|7891024132128
93721|PAPEL HIG PALOMA 4X30M NEUTRO|103|2|H|7896026838245
47368|CR DENTAL COLGATE 180G MPA|75|2|H|7891024134610
99865|PAPEL HIG PERSONAL VIP LV12 PG11 NEUTRO|208|2|H|7896110010731
97253|LEITE COND ITALAC GOUR 395G TP|78|2|H|7898080642646
100375|PAPEL HIG.DELUXE FD 12X20MT NEUTRO|78|2|H|7896914011217
94766|PAPEL HIG PERSONAL VIP LV12 PG11 NEUTRO|34|2|H|7896110008653
111218|CHOCO NESTLE ALPINO 80G|-149|1|B|7891000410707
27352|CHOC LACTA 80G AO LEITE|-191|1|B|7622210673831
862|TRIDENT MENTA 8G|-907|1|B|7895800304228
863|TRIDENT HORTELA AZUL 8G|-924|1|B|7895800304211
114790|BATATA ORIGINAL PRINGLES RETRO 104G|-12|1|B|7896004012063
94553|BOMBOM OURO BRANCO|-2218|1|B|78939318
107891|D.S.L. SABOR DOCE DE LEITE - DOCES TEMPOS (JUNCO)|-648|1|B|7898961756073
24598|BATATA TRAD MAIS BATATA 15KG|-88|1|B|7898921567985
25299|BISC AGUIA SALT SOL 360G ORIGINAL|-128|1|B|7896005223475
20775|BOLINHO BAUDUCCO 40 GR DUPLO CHOCOLATE|-1406|1|B|7891962031170
108562|DOCE DE LEITE CARACU SACHE 25G|-600|1|B|78939486
26871|CHOC LACTA 90G AO LEITE OREO|-57|1|B|7622210567567
29531|BOMBOM SONHO DE VALSA|-1890|1|B|78939301
95783|BATATA BEM BRASIL 400G II|-598|1|B|7898921567077
106724|CHOC TRENTO DUO 29G|-468|1|B|7896306625299
27737|NEGRESCO BISCOITO RECHEADO 90G|-430|1|B|7891000376768
102261|RUFFLES SAL 115G|-209|1|B|7892840817978
25524|BISC BAUDUCCO ROLLCAKE 34G CHOCOLATE|-429|1|B|7891962051574
104464|CHOC TRENTO DARK 29G|-18|1|B|7896306625275
70531|BATON GAROTO 16G LEITE|-3|1|B|78912359
31502|BISC NEGRESCO RECHEADO CHOC 90G|-103|1|B|7891000377130
39802|BOMBOM RECH CHOKITO 32G|-125|1|B|7891000462300
29644|BISC.NESTLE BONO RECH. CHOCOLATE 90GR|-1|1|B|7891000376843
102030|BISC.PETYAN 350GR MAIZENA 350GR|-37|1|B|7896532701088
102029|BISC.PETYAN 350GR CREAM CRACKER TOST 350GR|-86|1|B|7896532701781
5502|BISC. MY BIT CREAM CRACKER 350G|-52|1|B|7896408441148
109406|BISC. MY BIT MAIZENA 350G|-55|1|B|7896408441162
108107|CHOCOLATE EM PO 50%|-14|1|B|7896523181622
110198|BISCOITO LEITE RENATA PACOTE 360G|-26|1|B|7896022205225
115667|BATATA FGO GRELHADO SENSACOES LAYS 35G|-17|1|B|7892840825171
25298|BISC AGUIA SALT SOL 360G INTEGRAL|-10|1|B|7896005223512
110136|BISCOITO MAIZENA RENATA PACOTE 360G|-29|1|B|7896022205201
88777|MILHO DE PIPOCA AMAFIL 500G|-1|1|B|7896035950013
102028|BISC.PETYAN 350GR CREAM CRACKER 350GR|-108|1|B|7896532701064
51454|MILHO PIPOCA SINHA PREMIUM 500G|-27|1|B|7892300030107
2385|GOIABADA PREDILECTA 1KG|-1|1|B|7896292300064
69541|AMENDOIM PACHA 500G TORR MOIDO|-10|1|B|7896602900328
109994|BISCOITO CREAM CRACKER RENATA PACOTE 360G|-31|1|B|7896022205164
110129|BISCOITO MARIA RENATA PACOTE 360G|-33|1|B|7896022205218
110181|BISCOITO AGUA E SAL RENATA PACOTE 360G|-32|1|B|7896022205232
110228|BISCOITO RECHEIO MORANGO RENATA PACOTE 112G|-48|1|B|7896022207069
100721|BALA FINI BEIJOS 15G|1340|2|B|7898591450662
100722|BALA FINI DENTADURA 15G|1083|2|B|7898591450600
859|TRIDENTE MELANCIA 8G|912|2|B|7895800309780
107355|BALA.FINI 15G BANANAS 15GR|1339|2|B|7898591453410
103210|SALG DORITOS 75G QUEIJO NACHO|689|2|B|7892840822347
4904|HALLS EXTRA FORTE 28G|858|2|B|78938816
27526|CHOC LACTA 80G LAKA OREO|506|2|B|7622210674357
99788|BISC.RECH.NIKITO MORANGO 120GR|297|2|B|7896085087127
4905|HALLS MELANCIA 28G|860|2|B|78938854
4852|HALLS MORANGO 28G|739|2|B|78938847
30635|TRIDENT 8G TUTTI FRUTTI|376|2|B|7895800430002
7532|FINI TUBES ACIDO MORANGO 90G|345|2|B|8410525146435
4565|BIS XTRA AO LEITE 45G|967|2|B|7622300988470
29598|MINI OREO PACOTE 35GR|462|2|B|7622210933454
97490|BISC POLVILHO DONNUTS 200G DOCE|195|2|B|7898930856186
7534|FINI GELATINAS BEIJOS 100G|317|2|B|7898279790400
7533|FINI GELATINAS DENTADURAS 90G|356|2|B|7898279790417
7409|REGALIZ FINI 80G TUBO MORANGO|177|2|B|8410525159619
23404|FINI BALAS DE GELAT MINHOCAS BRI 90G|183|2|B|7898279790776
25561|ACHOC PO TODDY 370G ORIGINAL POTE|126|2|B|7892840819507
1956|ACHOC PO TODDY 200G|221|2|B|7894321711171
116022|CHOC SNICKERS 40G DARK|168|2|B|7896423439014
7429|GELATINA FINI 100G BANANAS|109|2|B|7898279790394
105112|BATATA PRINGLES ORIGINAL 104G|120|2|B|7896004006277
106312|PRINGLES CHURRASCO 109GR|86|2|B|7896004006406
95132|WAFER BIS 1008G BLACK|65|2|B|7622210833389
105755|CEREAL SUCRILHOS KELLOGGS ORIGINAL LV240G|53|2|B|7896004007618
34827|POLVILHO AMAFIL 1KG DOCE PP|140|2|B|7896035921211
23917|ACHOC TODDY 750GR POTE|41|2|B|7892840819170
25349|ACHOC TODDY 620G ORIG SACHE|44|2|B|7892840818876
62405|CHANTY MIX AMELIA 1KG TP|33|2|B|7896096007688
95725|OVOS DECS BRANCOS 20UN|-212|1|F|7898241710153
115810|LASANHA BOLONHESA MAMMA D'ALVA 600G|-2|1|F|7896074604496
103502|QUEIJO COALHO 7 ESPETOS BOUA|-19.8|1|F|7898040084523
45950|CR LEITE PIRACANJUBA 200G|-43|1|F|7898215151784
116039|PRESUNTO COZIDO FATIADO SEARA 180G|-27|1|F|7894904268511
85650|PIZZA SADIA 460G CALABRESA|-3|1|F|7893000632073
108213|FILE DE TILAPIA SEARA 600G|-6|1|F|7894904255030
23854|HAMBUR FRIBOI 90G BOVINO|-26|1|F|7898542022917
6717|LEITE CEMIL 1L INTEGRAL|-457|1|F|7896590801232
102860|PAO DE QUEIJO VO DELAIDE PCT 1KG|-41|1|F|7899966728225
26792|MARG DELICIA 250G C/SAL|-2|1|F|7894904271535
95890|LEITE PO PIRACANJUBA 400G ISTANTANEO|-5|1|F|7898215152439
99581|OVOS DECS BRANCO 12UN|843|2|F|7898241710078
24932|HAMBUR FRIBOI 56G AVES E BOVINO|588|2|F|7898542022931
92600|OVOS DECS VERMELHO 20UN|298|2|F|7898241710160
101081|LEITE NINHO INTEGRAL 1LT|146|2|F|7898215157403
50717|CR LEITE NESTLE 200G TP|265|2|F|7891000126905
98295|LEITE TRIANGULO 1L ZERO LACT|90|2|F|7896434921003
101082|LEITE NINHO SEMIDESNATADO 1LT|83|2|F|7898215157427
102966|LEITE PO NINHO INTEG INSTANT 380G|122|2|F|7891000393284
89862|COXINHA DA ASA SADIA 1KG|130|2|F|7893000488878
22274|LEITE PO NINHO 380G INTEGRAL|34|2|F|7891000325858
94536|MANTEIGA RADIO 500G SAL|23|2|F|7897013809071
2517|CAFE INDIANOPOLIS 500G|-26|1|M|7898312010021
108126|MANDIOCA SILVA1KG|-762|1|M|74468162501
2029|TEMP SAZON 60G VERMELHO|-45|1|M|7891132019281
30295|CAFE INDIANOPOLIS 250G|-81|1|M|7898312010014
103636|CAFE TORRADO E MOIDO BOM GOLE 500G|-10|1|M|736532616043
27998|EXT TOMATE ELEFANTE 300G POTE|-173|1|M|7896036000717
2642|CAFE CAJUBA 500G|-19|1|M|7896324400021
1224|MAC INST NISSIN MIOJO 85G MONICA TOMATE|-36|1|M|7891079001028
108289|CAFE TORRADO E MOIDO ALPINOPOLIS 500G|-205|1|M|40141015587
88773|FEIJAO CAR PARANAIBA 1KG|-113|1|M|7896444118219
96392|CUP NOODLES 72G COST CHURR|-36|1|M|7891079013083
107279|MOLHO TRADIC PEDACOS HEINZ SC 240G|-33|1|M|7896102503814
5927|PAO DE ALHO SO MINAS TRADICIONAL 300G|-62|1|M|7898913382039
23131|MAC SEMOLA CRISTAL 500G ESPAGUETE|-836|1|M|7896212911738
22779|AZEIT VERDE TOZZI 80G FATIADA SACHE|-337|1|M|7898598810858
2272|ACUCAR KEHDI 2KG|-45|1|M|7896430200027
845|BISNAGUITO PULLMAN 300G|-2|1|M|7896002360234
93380|MOLHO TOMATE DEZ ALIM 340G|-4|1|M|7898929590657
94004|PALHEIRO CANARINHO SLIM 10UN|-182|1|M|7898953264586
1287|CATCHUP DAJUDA SACHE 200G|-188|1|M|7896054903168
25518|MOLHO DE TOMATE POMAROLA TRADICIONAL 300G|-52|1|M|7896036099988
38921|MAIONESE HELLMANS 250G|-16|1|M|7894000050027
7892|MILHO VERDE MINAS 200G SACHET|-112|1|M|7898598216940
77631|ACUCAR DELTA 5KG|-102|1|M|7898935964039
35637|SARD COQUEIRO 125G TOMATE|-30|1|M|7896009301063
919|MAIONESE HELLMANNS 500G|-384|1|M|7894000050034
1536|FAR MAND AMAFIL 500G TORR BIJU|-45|1|M|7896035911311
1790|AMIDO MILHO MAIZENA 200G|-14|1|M|7894000010014
3979|CATCHUP DAJUDA 820G|-8|1|M|7896054901607
92023|MAC GALO SEMOLA 500G ESPAGUETE|-35|1|M|7896022200756
56480|SAL REF MARLIN 1KG|-185|1|M|7896101711012
54445|MAC GALO SEMOLA 500G PENA|-24|1|M|7896022200572
60518|CATCHUP DAJUDA 400G PICANTE|-5|1|M|7896054904301
110150|MACARRAO DE SEMOLA PADRE NOSSO GALO PACOTE 500G|-11|1|M|7896022200350
110280|MACARRAO DE SEMOLA PARAFUSO GALO PACOTE 500G|-45|1|M|7896022200534
40029|MAIONESE HELLMANS 200G SACHET|-125|1|M|7894000030470
99790|ATUM COQUEIRO RALADO OLEO 170GR|-18|1|M|7896009301131
99791|ATUM COQUEIRO RALADO AO NATURAL 170GR|-16|1|M|7896009301124
45705|OLEO SOJA SOYA 900ML PET|1386|2|M|7891107101621
97567|MILHO VERDE MINAS 200G|340|2|M|7898598211518
94366|ARROZ PATO SUL 5KG|520|2|M|7898949924128
95926|MILHO VERDE QUERO 180G|359|2|M|7896102500608
49913|FARINHA TRIGO LUNAR 1KG PREMIUM|121|2|M|7896185630346
1916|SARD GOMES DA COSTA 125G TOMATE|80|2|M|7891167021020
93507|ARROZ VASCONCELOS 5KG PREMIUM|64|2|M|7898949924074
1917|SARD GOMES DA COSTA 125G OLEO COM|55|2|M|7891167021013
50571|COLORIFICO SINHA 1050KG|104|2|M|7892300030619
115780|MAIONESE HELLMANNS POTE LV 600G PG 500G|38|2|M|7891150072053
54801|SARD GOMES DA COSTA 250G MOLHO TOMATE|44|2|M|7891167036888`.split('\n').map(l => {
    const [c, d, s, p, g, ean] = l.split('|'); return {c, d, s: +s, p: +p, g: GR[g] || g, ean};
  })};

  const CT = {
    lista: null, docLista: false, subL: null, subC: null, subR: '',
    cont: new Map(),            // cod -> {q, f, func, t}
    local: lsGet('ct.local', {}),   // contagens que não subiram (sem permissão / modo local)
    fat: lsGet('ct.fat', {}),       // cod -> unidades por fardo
    sec: 'Todas', soPri: false, soFalta: false, busca: '', aba: 'contar', filtroRes: 'div',
    atual: null, via: '', aviso: ''
  };
  window.CT = CT;

  const num = v => { const n = parseFloat(String(v ?? '').trim().replace(',', '.')); return isFinite(n) ? n : NaN; };
  const fmt = n => n == null || isNaN(n) ? '—' : String(+(+n).toFixed(3)).replace('.', ',');
  const real = v => 'R$ ' + (v || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const dig = s => String(s || '').replace(/\D/g, '');
  const lista = () => CT.lista || PADRAO;
  const rid = () => String(lista().rodada).replace(/[^\w-]/g, '');
  const itens = () => lista().itens;
  const contado = c => { const x = CT.cont.get(c); return x && typeof x.q === 'number' ? x : null; };
  const custo = c => { try{ const p = window.BX && BX.porCod && BX.porCod.get(c); return (p && p.custo) || 0; }catch(e){ return 0; } };
  const quem = () => {
    if (S.admin) return 'Gerente';
    let n = (window.BX && BX.func) || localStorage.getItem('bx.func') || '';
    if (!n){ n = (prompt('Seu nome (fica salvo neste celular):', '') || '').trim(); if (!n) return ''; localStorage.setItem('bx.func', n); if (window.BX) BX.func = n; }
    return n;
  };
  const dataBR = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}); };

  /* ---------- Dados ---------- */
  function assinar(){
    if (!S.db || !S.uid){ juntarLocal(); return; }
    if (!CT.subL){
      CT.subL = S.db.collection('config').doc('contagemLista').onSnapshot(d => {
        const ant = rid();
        CT.docLista = d.exists; CT.lista = d.exists && d.data().itens && d.data().itens.length ? d.data() : null;
        if (rid() !== ant){ CT.cont = new Map(); CT.atual = null; }
        assinarCont(); redesenhar(true);
      }, () => { assinarCont(); });
    }
    assinarCont();
  }
  function assinarCont(){
    if (!S.db || CT.subR === rid()) return;
    if (CT.subC){ try{ CT.subC(); }catch(e){} }
    CT.subR = rid(); let primeira = true;
    CT.subC = S.db.collection('contagem').where('r', '==', CT.subR).onSnapshot(snap => {
      const m = new Map();
      snap.docs.forEach(d => { const x = d.data(); m.set(x.c, x); if (typeof x.f === 'number' && x.f > 0) CT.fat[x.c] = x.f; });
      CT.cont = m; juntarLocal();
      if (primeira && !snap.metadata.fromCache){ primeira = false; reenviarLocal(); }
      redesenhar(false);
    }, e => { CT.aviso = 'Não consegui ler a contagem compartilhada (' + e.code + '). O que você contar fica salvo neste celular.'; juntarLocal(); redesenhar(false); });
  }
  // Junta o que ficou só no aparelho (mais novo vence)
  function juntarLocal(){
    const L = CT.local[rid()] || {};
    for (const [c, x] of Object.entries(L)){ const s = CT.cont.get(c); if (!s || (x.t || '') > (s.t || '')) CT.cont.set(c, x); }
  }
  function guardarLocal(c, rec){ (CT.local[rid()] ||= {})[c] = rec; lsSet('ct.local', CT.local); }
  function tirarLocal(c){ const L = CT.local[rid()]; if (L && L[c]){ delete L[c]; lsSet('ct.local', CT.local); } }
  function reenviarLocal(){ const L = CT.local[rid()] || {}; Object.entries(L).forEach(([c, x]) => subir(c, x)); }
  function subir(c, rec){
    if (!S.db){ guardarLocal(c, rec); return; }
    guardarLocal(c, rec);
    S.db.collection('contagem').doc(rid() + '_' + c).set(rec).then(() => { tirarLocal(c); if (CT.aviso){ CT.aviso = ''; redesenhar(false); } })
      .catch(e => { CT.aviso = e.code === 'permission-denied'
        ? 'O banco ainda não aceita a contagem (falta publicar as regras novas no Firebase). Tudo fica salvo neste celular e sobe sozinho depois.'
        : 'Falha ao gravar (' + e.code + '). Fica salvo neste celular e tenta de novo.'; redesenhar(false); });
  }
  function gravar(c, q, f){
    const func = quem(); if (!func) return false;
    const rec = {r: rid(), c, q: q == null ? null : +(+q).toFixed(3), f: f || CT.fat[c] || null, func, t: new Date().toISOString()};
    if (f) { CT.fat[c] = f; lsSet('ct.fat', CT.fat); }
    CT.cont.set(c, rec); subir(c, rec);
    return true;
  }

  /* ---------- Bipar ---------- */
  function acharNaLista(code){
    const c = dig(code); if (!c) return null;
    const L = itens();
    if (c.length <= 6) return L.find(i => i.c === c || i.c === String(+c)) || null;
    const e = c.replace(/^0+/, '');
    let it = L.find(i => i.ean && dig(i.ean).replace(/^0+/, '') === e);
    if (!it && window.BX && BX.porEan){ const p = BX.porEan.get(e); if (p && p.cod) it = L.find(i => i.c === p.cod); }
    return it || null;
  }
  function ctMsg(t, kind){ const m = $('#scanMsg'); if (m){ m.className = 'msg ' + kind; m.textContent = t; } }
  function ctBipar(code, via){
    const it = acharNaLista(code);
    const camAberta = !!$('#cam');
    if (camAberta && typeof fecharCamera === 'function') fecharCamera();
    CT.via = via || (camAberta ? 'cam' : 'leitor');
    if (!it){ try{ beep(false); }catch(e){} ctMsg('Código ' + code + ' não está na lista desta contagem.', 'warn'); return; }
    try{ beep(true); }catch(e){}
    ctMsg('✓ ' + it.d, 'ok'); abrirItem(it);
  }
  function abrirItem(it){
    CT.atual = it; desenharForm();
    setTimeout(() => { const q = $('#ctQtd'); if (q){ q.focus(); q.select(); } }, 60);
  }

  /* ---------- Telas ---------- */
  const ESTILO = `
    .ct-top{background:linear-gradient(135deg,#1d4f91,#13335f);color:#fff;border-radius:16px;padding:14px 16px;margin-bottom:10px}
    .ct-top b.t{font-size:18px}.ct-top .bar{background:rgba(255,255,255,.25)}.ct-top .bar>i{background:#ffcc00}
    .ct-top .s{font-size:14px;opacity:.92}
    .ct-n{width:96px;font-size:20px;font-weight:800;text-align:center;padding:10px 6px;border-radius:10px;border:2px solid var(--line);background:var(--card);color:var(--ink);font-variant-numeric:tabular-nums}
    .item.ok .ct-n{border-color:var(--green)}
    .ct-fd{grid-column:1/-1;display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:14px;background:var(--amber-bg);border-radius:10px;padding:8px}
    .ct-fd input{width:68px;font-size:18px;text-align:center;font-weight:700;padding:8px 4px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
    .ct-link{border:0;background:none;color:var(--blue);padding:4px 0;min-height:30px;font-size:13px;font-weight:600}
    .ct-urg{color:var(--red);font-weight:700}
    .ct-res td{font-size:13px}.ct-res .pos{color:var(--green);font-weight:700}.ct-res .neg{color:var(--red);font-weight:700}`;
  if (!document.getElementById('ctCss')){ const st = document.createElement('style'); st.id = 'ctCss'; st.textContent = ESTILO; document.head.appendChild(st); }

  function progresso(){
    const L = itens(), n = L.filter(i => contado(i.c)).length, pri = L.filter(i => i.p === 1), pf = pri.filter(i => contado(i.c)).length;
    return {n, total: L.length, pri: pri.length, pf, pct: L.length ? n / L.length * 100 : 0};
  }

  function renderContagem(app){
    $('#title').textContent = 'Contagem de estoque';
    assinar();
    if (!S.admin) CT.aba = 'contar';
    if (S.admin && window.BX && typeof BX.carregarProdutos === 'function') BX.carregarProdutos();
    const abas = S.admin ? `<div class="tabs" id="ctAbas"><button data-a="contar" class="${CT.aba === 'contar' ? 'on' : ''}" style="flex:1;font-size:15px;min-height:42px">📋 Contar</button><button data-a="res" class="${CT.aba === 'res' ? 'on' : ''}" style="flex:1;font-size:15px;min-height:42px">📊 Resultado</button></div>` : '';
    if (CT.aba === 'res'){
      app.innerHTML = `<div id="ctRoot">${abas}<div id="ctTop"></div><div id="ctRes"></div></div>`;
      ligarAbas(); desenharTopo(); desenharResultado(); return;
    }
    app.innerHTML = `<div id="ctRoot">${abas}<div id="ctTop"></div>
      <div class="scan"><div class="row" style="flex-wrap:nowrap">
        <input id="ctScan" inputmode="search" autocomplete="off" placeholder="Bipe ou digite código / nome" style="flex:1" value="${esc(CT.busca)}">
        <button onclick="abrirCamera()" style="min-width:56px;font-size:22px" aria-label="Câmera">📷</button></div>
        <div id="scanMsg" class="msg"></div></div>
      <div id="ctForm"></div>
      <div class="tabs" id="ctSecs"></div>
      <div class="tabs" id="ctFil">
        <button data-f="pri" class="${CT.soPri ? 'on' : ''}">🔴 Só os urgentes</button>
        <button data-f="falta" class="${CT.soFalta ? 'on' : ''}">Só os que faltam contar</button></div>
      <div id="ctLista"></div>
      <p class="mut" style="margin-top:14px">Conte o que tem na loja inteira (gôndola + depósito), em unidades. Se não achar nenhum, digite 0. Pode dividir: cada pessoa escolhe uma seção — a contagem é compartilhada, todo mundo vê ao vivo.${S.admin ? '' : ' Contando como <b>' + esc(localStorage.getItem('bx.func') || '—') + '</b> · <a href="#" onclick="CT.trocarNome();return false" style="color:var(--blue)">trocar</a>'}</p>
    </div>`;
    ligarAbas();
    const inp = $('#ctScan');
    inp.onkeydown = e => { if (e.key !== 'Enter') return; const v = inp.value.trim(); if (!v) return; if (/^\d+$/.test(v)){ inp.value = ''; CT.busca = ''; ctBipar(v, 'leitor'); desenharLista(); } };
    inp.oninput = () => { CT.busca = /^\d+$/.test(inp.value.trim()) ? '' : inp.value.trim(); desenharLista(); };
    $('#ctFil').onclick = e => { const f = e.target.closest('button')?.dataset.f; if (!f) return; if (f === 'pri') CT.soPri = !CT.soPri; else CT.soFalta = !CT.soFalta;
      $('#ctFil').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === 'pri' ? CT.soPri : CT.soFalta)); desenharLista(); };
    $('#ctSecs').onclick = e => { const s = e.target.closest('button')?.dataset.s; if (!s) return; CT.sec = s; desenharLista(); };
    ligarLista();
    desenharTopo(); desenharForm(); desenharLista();
  }
  function ligarAbas(){ const t = $('#ctAbas'); if (t) t.onclick = e => { const a = e.target.closest('button')?.dataset.a; if (!a || a === CT.aba) return; CT.aba = a; CT.renderFeito = ''; render(); }; }

  function desenharTopo(){
    const el = $('#ctTop'); if (!el) return;
    const p = progresso();
    el.innerHTML = `<div class="ct-top"><b class="t">${esc(lista().nome || 'Contagem')}</b>
      <div class="bar"><i style="width:${p.pct.toFixed(1)}%"></i></div>
      <div class="s"><b>${p.n} de ${p.total}</b> contados · urgentes <b>${p.pf} de ${p.pri}</b></div></div>
      ${CT.aviso ? `<div class="msg warn" style="display:block;margin-bottom:10px">${esc(CT.aviso)}</div>` : ''}`;
  }

  function desenharForm(){
    const el = $('#ctForm'); if (!el) return;
    const it = CT.atual; if (!it){ el.innerHTML = ''; return; }
    const x = contado(it.c), fd = CT.fat[it.c] || '';
    el.innerHTML = `<div class="card" style="border:2px solid var(--blue)">
      <div style="font-weight:700;font-size:17px">${esc(it.d)}</div>
      <div class="mut">Cód. ${esc(it.c)}${it.p === 1 ? ' · <span class="ct-urg">URGENTE</span>' : ''}${x ? ' · já contado: <b>' + fmt(x.q) + '</b> (' + esc(x.func) + ')' : ''}</div>
      <div class="ct-fd" style="margin-top:8px"><input id="ctF" inputmode="numeric" placeholder="0" aria-label="Fardos"> fardos de
        <input id="ctX" inputmode="numeric" placeholder="un" value="${fd}" aria-label="Unidades por fardo"> + <input id="ctS" inputmode="numeric" placeholder="0" aria-label="Soltas"> soltas</div>
      <div class="row" style="margin-top:8px;flex-wrap:nowrap">
        <input id="ctQtd" inputmode="decimal" placeholder="Total em unidades" value="${x ? fmt(x.q) : ''}" style="flex:1;min-width:0;font-size:24px;font-weight:800;text-align:center;padding:12px;border-radius:12px;border:2px solid var(--green);background:var(--card);color:var(--ink)"><b>un</b></div>
      <div class="row" style="margin-top:10px"><button onclick="CT.fecharItem()" style="flex:1">Cancelar</button><button class="pri" id="ctSalvar" style="flex:2">${CT.via === 'cam' ? 'Salvar e bipar outro' : 'Salvar'}</button></div></div>`;
    const soma = () => { const f = num($('#ctF').value) || 0, xx = num($('#ctX').value) || 0, s = num($('#ctS').value) || 0; if (f || s) $('#ctQtd').value = fmt(f * xx + s); };
    ['#ctF', '#ctX', '#ctS'].forEach(s => $(s).oninput = soma);
    $('#ctSalvar').onclick = salvarAtual;
    el.querySelectorAll('input').forEach(i => i.onkeydown = e => { if (e.key === 'Enter') salvarAtual(); });
  }
  function salvarAtual(){
    const it = CT.atual; if (!it) return;
    const q = num($('#ctQtd').value);
    if (isNaN(q) || q < 0){ toast('Digite a quantidade contada (0 se não tiver).', 'err'); return; }
    const xx = num($('#ctX').value);
    if (!gravar(it.c, q, xx > 0 ? xx : null)) return;
    toast('Contado: ' + it.d + ' · ' + fmt(q) + ' un', 'ok');
    CT.atual = null; desenharForm(); desenharTopo(); atualizarLinha(it.c); desenharSecs();
    if (CT.via === 'cam' && typeof abrirCamera === 'function') setTimeout(abrirCamera, 150);
    else setTimeout(() => $('#ctScan')?.focus(), 60);
  }

  function visiveis(){
    const q = CT.busca.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
    return itens().filter(i => (CT.sec === 'Todas' || i.g === CT.sec) && (!CT.soPri || i.p === 1) && (!CT.soFalta || !contado(i.c))
      && (!q.length || q.every(t => i.d.includes(t) || i.c === t)));
  }
  function desenharSecs(){
    const el = $('#ctSecs'); if (!el) return;
    const secs = ['Todas', ...new Set(itens().map(i => i.g))];
    el.innerHTML = secs.map(s => { const n = itens().filter(i => s === 'Todas' || i.g === s); const f = n.filter(i => contado(i.c)).length;
      return `<button data-s="${esc(s)}" class="${CT.sec === s ? 'on' : ''}">${esc(s)} · ${f}/${n.length}</button>`; }).join('');
  }
  function linha(i){
    const x = contado(i.c), fd = CT.fat[i.c];
    return `<div class="item ${x ? 'ok' : ''}" data-c="${esc(i.c)}">
      <div><div class="d">${esc(i.d)}</div>
        <div class="e">Cód. ${esc(i.c)}${i.p === 1 ? ' · <span class="ct-urg">URGENTE</span>' : ''}${fd ? ' · fardo de ' + fmt(fd) : ''}${S.admin ? ' · sistema: ' + fmt(i.s) : ''}<span class="ct-quem">${x ? ' · ' + esc(x.func) : ''}</span></div>
        <button class="ct-link" data-fd="${esc(i.c)}">Contar por fardo</button></div>
      <input class="ct-n" inputmode="decimal" value="${x ? fmt(x.q) : ''}" placeholder="—" aria-label="Quantidade contada de ${esc(i.d)}">
      <div class="ct-fd hide" data-fdrow="${esc(i.c)}"><input data-k="f" inputmode="numeric" placeholder="0" aria-label="Fardos"> fardos de
        <input data-k="x" inputmode="numeric" placeholder="un" value="${fd || ''}" aria-label="Unidades por fardo"> + <input data-k="s" inputmode="numeric" placeholder="0" aria-label="Soltas"> soltas</div></div>`;
  }
  function desenharLista(){
    desenharSecs();
    const el = $('#ctLista'); if (!el) return;
    const vis = visiveis(); let h = '', last = '';
    for (const i of vis){ if (i.g !== last){ h += `<div class="cat">${esc(i.g)}</div>`; last = i.g; } h += linha(i); }
    el.innerHTML = h || '<div class="mut" style="padding:16px 4px;text-align:center">Nada para mostrar com esse filtro.</div>';
  }
  function ligarLista(){
    const el = $('#ctLista'); if (!el) return;
    el.addEventListener('change', e => {
      const row = e.target.closest('[data-c]'); if (!row) return; const c = row.dataset.c;
      if (e.target.dataset.k){
        const fr = e.target.closest('.ct-fd'); const f = num(fr.querySelector('[data-k=f]').value) || 0, xx = num(fr.querySelector('[data-k=x]').value) || 0, s = num(fr.querySelector('[data-k=s]').value) || 0;
        if (!(f || s)) return;
        const tot = f * xx + s; row.querySelector('.ct-n').value = fmt(tot);
        if (gravar(c, tot, xx > 0 ? xx : null)){ atualizarLinha(c); desenharTopo(); desenharSecs(); }
        return;
      }
      if (!e.target.classList.contains('ct-n')) return;
      const v = e.target.value.trim();
      if (v === ''){ if (contado(c) && confirm('Apagar a contagem deste item?')) gravar(c, null); else e.target.value = contado(c) ? fmt(contado(c).q) : ''; }
      else { const n = num(v); if (isNaN(n) || n < 0){ toast('Quantidade inválida.', 'err'); e.target.value = contado(c) ? fmt(contado(c).q) : ''; return; } if (!gravar(c, n)) { e.target.value = ''; return; } }
      atualizarLinha(c); desenharTopo(); desenharSecs();
    });
    el.addEventListener('click', e => { const c = e.target.dataset?.fd; if (!c) return; const r = el.querySelector(`[data-fdrow="${CSS.escape(c)}"]`); r.classList.toggle('hide'); if (!r.classList.contains('hide')) r.querySelector('[data-k=f]').focus(); });
    el.addEventListener('keydown', e => { if (e.key !== 'Enter' || !e.target.classList.contains('ct-n')) return; e.preventDefault();
      const ins = [...el.querySelectorAll('.ct-n')]; const k = ins.indexOf(e.target); e.target.blur(); if (ins[k + 1]) ins[k + 1].focus(); });
  }
  function atualizarLinha(c){
    const row = document.querySelector(`#ctLista [data-c="${CSS.escape(c)}"]`); if (!row) return;
    const x = contado(c); row.classList.toggle('ok', !!x);
    const inp = row.querySelector('.ct-n'); if (inp && document.activeElement !== inp) inp.value = x ? fmt(x.q) : '';
    const qm = row.querySelector('.ct-quem'); if (qm) qm.textContent = x ? ' · ' + x.func : '';
  }

  /* ---------- Resultado (gerente) ---------- */
  function linhasRes(){
    return itens().map(i => { const x = contado(i.c); const q = x ? x.q : null; const dif = x ? q - i.s : null; const cu = custo(i.c);
      return {...i, q, dif, cu, val: dif != null ? dif * cu : 0, func: x ? x.func : '', t: x ? x.t : ''}; });
  }
  function desenharResultado(){
    const el = $('#ctRes'); if (!el) return;
    const R = linhasRes(), feitos = R.filter(r => r.q != null);
    const sobe = feitos.filter(r => r.val > 0).reduce((s, r) => s + r.val, 0), desce = feitos.filter(r => r.val < 0).reduce((s, r) => s + r.val, 0);
    const semCusto = feitos.filter(r => !r.cu).length, iguais = feitos.filter(r => Math.abs(r.dif) < 0.001).length;
    let ver = CT.filtroRes === 'faltam' ? R.filter(r => r.q == null) : CT.filtroRes === 'todos' ? feitos : feitos.filter(r => Math.abs(r.dif) >= 0.001);
    ver = ver.slice().sort((a, b) => CT.filtroRes === 'faltam' ? (a.p - b.p || a.g.localeCompare(b.g)) : (Math.abs(b.val) - Math.abs(a.val) || Math.abs(b.dif) - Math.abs(a.dif)));
    el.innerHTML = `
      <div class="kpis4">
        <div class="kpi g"><div class="l">Contados</div><div class="v">${feitos.length}/${R.length}</div><div class="s">${iguais} batem com o sistema</div></div>
        <div class="kpi"><div class="l">Faltam contar</div><div class="v">${R.length - feitos.length}</div><div class="s">urgentes: ${R.filter(r => r.q == null && r.p === 1).length}</div></div>
        <div class="kpi y"><div class="l">Ajuste para cima</div><div class="v">${real(sobe)}</div><div class="s">entra no estoque do sistema</div></div>
        <div class="kpi k"><div class="l">Ajuste para baixo</div><div class="v">${real(-desce)}</div><div class="s">sai do estoque do sistema</div></div>
      </div>
      ${semCusto ? `<p class="mut" style="color:var(--amber);margin:0 0 8px">${semCusto} item(ns) contado(s) sem custo na tabela de produtos: o valor do ajuste deles ficou de fora.</p>` : ''}
      <div class="card"><b>Mandar a contagem</b>
        <div class="row" style="margin-top:8px">
          <button onclick="CT.copiarInv()" style="flex:1">📋 Copiar para o inventário do Avanço</button>
          <button onclick="CT.copiarCont()" style="flex:1">#CONT para a cotação</button>
          <button onclick="CT.baixar()" style="flex:1">⬇ Baixar planilha</button></div>
        <p class="mut" style="margin:8px 0 0">Inventário: uma linha por item, <i>código;quantidade contada</i>. Antes de gravar no Avanço, confira a lista.</p></div>
      <div class="tabs" id="ctResF">
        <button data-r="div" class="${CT.filtroRes === 'div' ? 'on' : ''}">Com diferença</button>
        <button data-r="todos" class="${CT.filtroRes === 'todos' ? 'on' : ''}">Todos contados</button>
        <button data-r="faltam" class="${CT.filtroRes === 'faltam' ? 'on' : ''}">Faltam contar</button></div>
      <div class="card ct-res" style="padding:8px 10px;overflow-x:auto">${ver.length ? `<table>
        <tr><th>Produto</th><th class="num">Sistema</th><th class="num">Contado</th><th class="num">Dif.</th><th class="num">Ajuste</th></tr>
        ${ver.map(r => `<tr><td>${esc(r.d)}<div class="mut" style="font-size:12px">${esc(r.c)}${r.p === 1 ? ' · <span class="ct-urg">urgente</span>' : ''}${r.func ? ' · ' + esc(r.func) + ' ' + dataBR(r.t) : ''}</div></td>
          <td class="num">${fmt(r.s)}</td><td class="num"><b>${fmt(r.q)}</b></td>
          <td class="num ${r.dif > 0 ? 'pos' : r.dif < 0 ? 'neg' : ''}">${r.dif == null ? '—' : (r.dif > 0 ? '+' : '') + fmt(r.dif)}</td>
          <td class="num">${r.dif == null ? '—' : r.cu ? real(r.val) : '<span class="mut">sem custo</span>'}</td></tr>`).join('')}</table>`
        : '<div class="mut" style="padding:10px">Nada aqui.</div>'}</div>
      <div class="card"><b>Lista da contagem</b>
        <p class="mut" style="margin:6px 0">${CT.docLista ? 'Lista importada' : 'Lista de 24/11 que veio no app'} · ${R.length} itens · rodada ${esc(rid())}</p>
        <div class="row"><button onclick="CT.importar()" style="flex:1">Importar nova lista (planilha)</button><button class="warn" onclick="CT.recomecar()" style="flex:1">Recomeçar contagem</button></div>
        <p class="mut" style="margin:8px 0 0">Planilha: colunas código, descrição e estoque. Opcionais: seção, código de barras e urgente (sim/não). Sem a coluna urgente, estoque negativo conta como urgente.</p></div>`;
    $('#ctResF').onclick = e => { const r = e.target.closest('button')?.dataset.r; if (!r) return; CT.filtroRes = r; desenharResultado(); };
  }

  async function salvarLista(nova){
    await S.db.collection('config').doc('contagemLista').set(nova);
  }
  async function importarLista(file){
    const wb = XLSX.read(await file.arrayBuffer(), {type: 'array'});
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, defval: ''});
    const hi = linhas.findIndex(r => r.some(c => /descri/i.test(c)));
    if (hi < 0){ toast('Não achei a coluna de descrição na planilha.', 'err'); return; }
    const H = linhas[hi].map(c => String(c).toLowerCase());
    const col = re => H.findIndex(h => re.test(h));
    const cCod = col(/^c[óo]d(igo)?\b(?!.*barra)|interno|^c[óo]d\.?$/), cDesc = col(/descri/), cEst = col(/estoque|saldo|sistema|qtd|quant/),
      cSec = col(/se[cç][aã]o|grupo|depart|categ|setor/), cEan = col(/barra|ean|gtin/), cUrg = col(/urgen|priori|pedido/);
    if (cCod < 0 || cDesc < 0 || cEst < 0){ toast('A planilha precisa das colunas código, descrição e estoque.', 'err'); return; }
    const vistos = new Set(), novos = [];
    for (const r of linhas.slice(hi + 1)){
      const c = dig(r[cCod]), d = String(r[cDesc]).trim().toUpperCase(); if (!c || !d || vistos.has(c)) continue; vistos.add(c);
      const s = num(String(r[cEst]).replace(/\.(?=\d{3}(\D|$))/g, '')) || 0;
      let ean = cEan >= 0 ? dig(r[cEan]) : ''; if (!ean && window.BX && BX.porCod){ const p = BX.porCod.get(c); if (p) ean = p.ean || ''; }
      const urg = cUrg >= 0 ? /^(s|sim|x|1|urg)/i.test(String(r[cUrg]).trim()) : s < 0;
      novos.push({c, d, s, p: urg ? 1 : 2, g: cSec >= 0 && String(r[cSec]).trim() ? String(r[cSec]).trim() : 'Geral', ean});
    }
    if (!novos.length){ toast('Nenhum item na planilha.', 'err'); return; }
    novos.sort((a, b) => a.g.localeCompare(b.g) || a.p - b.p);
    const agora = new Date().toISOString();
    confirmar(`Trocar a lista por ${novos.length} itens (${novos.filter(i => i.p === 1).length} urgentes)? A contagem começa do zero.`, 'Trocar lista', async () => {
      try{ await salvarLista({rodada: agora.replace(/[:.]/g, '-'), nome: 'Contagem de ' + new Date().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}), em: agora, itens: novos}); toast('Lista nova publicada.', 'ok'); }
      catch(e){ toast('Não salvou: ' + e.message, 'err'); }
    });
  }

  /* ---------- Ações ---------- */
  CT.fecharItem = () => { CT.atual = null; desenharForm(); $('#ctScan')?.focus(); };
  CT.trocarNome = () => { const n = prompt('Seu nome:', localStorage.getItem('bx.func') || ''); if (n && n.trim()){ localStorage.setItem('bx.func', n.trim()); if (window.BX) BX.func = n.trim(); render(); } };
  CT.copiarInv = () => { const R = linhasRes().filter(r => r.q != null); if (!R.length){ toast('Nada contado ainda.', 'warn'); return; } copiar(R.map(r => r.c + ';' + fmt(r.q)).join('\n')); };
  CT.copiarCont = () => { const R = linhasRes().filter(r => r.q != null); if (!R.length){ toast('Nada contado ainda.', 'warn'); return; }
    copiar(`*Contagem Lelê Supermercados*\nData: ${new Date().toLocaleString('pt-BR')}\nItens contados: ${R.length}\n\n#CONT|${R.map(r => r.c + '=' + r.q).join(';')}|FIM`); };
  CT.baixar = () => {
    const rows = linhasRes().map(r => ({Codigo: r.c, Descricao: r.d, EAN: r.ean || '', Secao: r.g, Urgente: r.p === 1 ? 'SIM' : '', Sistema: r.s, Contado: r.q, Diferenca: r.dif, Custo: r.cu || '', Ajuste: r.dif != null && r.cu ? +r.val.toFixed(2) : '', Quem: r.func, Quando: dataBR(r.t)}));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Contagem');
    XLSX.writeFile(wb, 'contagem-lele-' + rid() + '.xlsx');
  };
  CT.importar = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.xlsx,.xls,.csv'; i.onchange = () => i.files[0] && importarLista(i.files[0]).catch(e => toast('Erro ao importar: ' + e.message, 'err')); i.click(); };
  CT.recomecar = () => confirmar('Começar uma contagem nova com a mesma lista? As quantidades contadas até agora deixam de aparecer (baixe a planilha antes, se quiser guardar).', 'Recomeçar', async () => {
    const agora = new Date().toISOString(), L = lista();
    try{ await salvarLista({rodada: agora.replace(/[:.]/g, '-'), nome: L.nome || 'Contagem', em: agora, itens: L.itens}); toast('Contagem zerada.', 'ok'); }
    catch(e){ toast('Não salvou: ' + e.message, 'err'); }
  });

  /* ---------- Atalho no painel do gerente ---------- */
  function cartaoMenu(){
    const app = $('#app'); if (!app || app.querySelector('#ctAtalho')) return;
    const ats = app.querySelectorAll('.atalho'); if (!ats.length) return;
    assinar();
    const p = progresso();
    const d = document.createElement('div');
    d.className = 'card pedido atalho'; d.id = 'ctAtalho'; d.onclick = () => go('contagem');
    d.innerHTML = `<div class="ic" style="background:#e4edf8">📋</div>
      <div style="flex:1"><h3>Contagem de estoque</h3><div class="mut">Itens defasados · ${p.n} de ${p.total} contados · urgentes ${p.pf}/${p.pri}</div>
      <div class="bar" style="margin-bottom:0"><i style="width:${p.pct.toFixed(1)}%;background:#1d4f91"></i></div></div><b style="font-size:22px;color:var(--mut)">›</b>`;
    ats[ats.length - 1].after(d);
  }

  /* ---------- Redesenho sem perder o que está sendo digitado ---------- */
  function redesenhar(estrutura){
    if (S.view === 'menu'){ const a = $('#ctAtalho'); if (a){ a.remove(); } if (S.admin) cartaoMenu(); return; }
    if (S.view !== 'contagem' || !$('#ctRoot')) return;
    if (estrutura){ CT.renderFeito = ''; return render(); }
    desenharTopo();
    if (CT.aba === 'res'){ desenharResultado(); return; }
    desenharSecs(); itens().forEach(i => atualizarLinha(i.c));
  }

  /* ---------- Encaixe no app ---------- */
  const renderAnt = render, biparAnt = bipar, backAnt = $('#back').onclick;
  render = function(){
    if (S.view === 'contagem'){
      $('#back').classList.remove('hide');
      if ($('#ctRoot') && CT.renderFeito === CT.aba + '|' + S.admin){ return redesenhar(false); }   // atualização de outro módulo: não apaga o que está sendo digitado
      CT.renderFeito = CT.aba + '|' + S.admin;
      return renderContagem($('#app'));
    }
    CT.renderFeito = '';
    const r = renderAnt.apply(this, arguments);
    if (S.view === 'menu' && S.admin) cartaoMenu();
    return r;
  };
  bipar = function(code){ return S.view === 'contagem' ? ctBipar(code) : biparAnt.apply(this, arguments); };
  $('#back').onclick = () => S.view === 'contagem' ? go('menu') : backAnt && backAnt();

  // Link direto .../#contagem
  if (location.hash === '#contagem' && !/shared=1/.test(location.search)) S.view = 'contagem';
  render();
})();
