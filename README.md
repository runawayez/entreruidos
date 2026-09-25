# Entre Ruidos — site

Site estático do podcast com player e episódios carregados automaticamente pelo RSS.

## Atualização do feed

Esta versão **não usa mais rss2json**. A função `api/rss.js` da Vercel busca diretamente:

`https://anchor.fm/s/117a3989c/podcast/rss`

A resposta é enviada com cache desativado, então episódios novos aparecem sem depender do cache de terceiros.

## Deploy na Vercel

Suba todos os arquivos deste diretório para o mesmo repositório, incluindo a pasta `api/`. Depois faça push na branch conectada à Vercel.

Estrutura:

```
api/
  rss.js
index.html
style.css
script.js
README.md
```

Não precisa de banco de dados, pacote npm ou configuração de build.
