# Finanças PME — Guia de Instalação e Hospedagem Gratuita

App de gestão financeira para pequenas empresas com leitura de notas fiscais
e comprovantes PIX por inteligência artificial.

---

## Estrutura do projeto

```
financas-pme/
├── index.html          ← App principal
├── manifest.json       ← Configuração PWA (instalar como app)
├── sw.js               ← Service Worker (funcionar offline)
├── vercel.json         ← Configuração de hospedagem
├── icons/
│   ├── icon-192.png    ← Ícone do app
│   └── icon-512.png    ← Ícone do app (maior)
└── src/
    ├── style.css       ← Visual do app
    ├── app.js          ← Lógica principal
    └── register-sw.js  ← Registro do Service Worker
```

---

## PASSO A PASSO: Publicar gratuitamente

### Etapa 1 — Obter sua chave da API Claude (gratuito)

1. Acesse: https://console.anthropic.com
2. Crie uma conta gratuita (não precisa de cartão de crédito para começar)
3. Vá em "API Keys" → "Create Key"
4. Copie a chave (começa com `sk-ant-...`)
5. Você usará essa chave nas configurações do app

> O plano gratuito da Anthropic oferece créditos iniciais suficientes
> para testar. Para uso contínuo, o custo é muito baixo (frações de
> centavo por documento escaneado).

---

### Etapa 2 — Publicar no GitHub (gratuito)

O GitHub armazena seu código. O Vercel vai buscar o código de lá.

1. Acesse: https://github.com e crie uma conta gratuita
2. Clique em "New repository"
3. Nome: `financas-pme`
4. Deixe "Public" e clique "Create repository"
5. Na próxima tela, clique em "uploading an existing file"
6. Arraste todos os arquivos desta pasta para lá
   (index.html, manifest.json, sw.js, vercel.json, pasta src/, pasta icons/)
7. Clique "Commit changes"

---

### Etapa 3 — Hospedar no Vercel (gratuito, HTTPS automático)

1. Acesse: https://vercel.com e clique "Sign up with GitHub"
2. Clique "Add New Project"
3. Selecione o repositório `financas-pme`
4. Clique "Deploy" (sem alterar nada)
5. Em ~1 minuto, o Vercel gera um link como:
   `https://financas-pme.vercel.app`

Pronto! O app está no ar com HTTPS, funciona no celular e pode ser
instalado como aplicativo nativo.

---

### Etapa 4 — Configurar o app no celular

1. Abra o link do Vercel no celular (Chrome ou Safari)
2. Toque no ícone de compartilhar (Safari) ou menu (Chrome)
3. Selecione "Adicionar à tela de início"
4. O app aparece como ícone, igual a um app nativo
5. Abra o app → toque no avatar no canto superior direito
6. Configure o nome da empresa e cole sua chave de API Claude
7. Pronto para usar!

---

## Funcionalidades do app

### Escanear documentos com IA
- Fotografe comprovantes de PIX, notas fiscais ou recibos
- A IA extrai automaticamente: valor, data, tipo, descrição
- Você confirma e salva com um toque

### Lançamento manual
- Entrada ou saída com categoria
- Categorias: Vendas, Serviços, Fornecedor, Aluguel, Pessoal, Outros

### Dashboard
- Saldo atual em tempo real
- Total de entradas e saídas
- Gráfico de fluxo de caixa dos últimos 7 dias
- Últimos lançamentos

### Histórico
- Filtre por: todos, entradas, saídas, PIX, nota fiscal
- Resumo do período filtrado

---

## Custos

| Recurso              | Plano gratuito inclui        |
|----------------------|------------------------------|
| GitHub               | Repositórios públicos — grátis para sempre |
| Vercel               | 100GB bandwidth/mês — grátis para sempre   |
| Anthropic Claude API | ~$5 em créditos iniciais gratuitos         |
| Domínio .vercel.app  | Incluído grátis no Vercel                  |

Para domínio próprio (ex: minhaempresa.com.br): ~R$ 40/ano no Registro.br

---

## Personalização fácil

Para mudar o nome e cor principal do app, edite:

`index.html` linha 5: mude "Finanças PME"

`src/style.css` linha 8: mude `--blue: #2a78d6` para outra cor hex

`manifest.json` linha 2: mude `"name": "Finanças PME"`

---

## Suporte e dúvidas

Este app foi criado com auxílio de inteligência artificial (Claude, da Anthropic).
Para adaptações e novas funcionalidades, consulte um desenvolvedor local ou
continue usando o Claude para gerar melhorias.
