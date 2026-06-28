// Adicione esta tag <script> antes de </body> no index.html
// para registrar o Service Worker (suporte offline / instalação como app)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.log('SW falhou:', err));
  });
}
