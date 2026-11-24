// ============================================================
//  CONFIGURAÇÃO DO APP DE SEPARAÇÃO
// ============================================================

window.APP_CONFIG = {

  // Nome que aparece no topo do app
  nomeLoja: "Lelê Supermercados",

  // E-mail(s) de quem pode LIBERAR pedidos (gerente).
  // Tem que ser o mesmo e-mail criado no Firebase > Authentication > Usuários
  // e o mesmo que está nas regras do Firestore.
  gerentes: ["iury707@gmail.com"],

  // Projeto Firebase "separacao-lele" (essas chaves podem ficar no site, são públicas
  // por natureza; quem protege os dados são as regras de segurança do Firestore).
  firebase: {
    apiKey: "AIzaSyBoTTQ6PQBosL94SP96HpeFXn9XRR6cm6Y",
    authDomain: "separacao-lele.firebaseapp.com",
    projectId: "separacao-lele",
    storageBucket: "separacao-lele.firebasestorage.app",
    messagingSenderId: "326400344276",
    appId: "1:326400344276:web:e5119724ba7016733bbb41"
  }
};
