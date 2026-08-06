/* ============================================================
   BPlen — Sistema de Documentos
   exportar.js — Camada 2: exportacao (PDF, Word, HTML)

   Modulo compartilhado por todos os templates do kit. Carregar
   com <script src="../sistema/exportar.js"></script> no fim do
   body — script classico, nao module (modules sao bloqueados
   por CORS quando o arquivo e aberto direto do disco).

   Expoe: exportarPdf(), exportarWord(), exportarHtml().

   O HTML e o documento-mestre. Word e HTML sao gerados a partir
   dele; nenhum dos dois deve ser editado em paralelo.
   ============================================================ */

(function () {
  "use strict";

  /* Codigo do documento: BPL-CONTEXTO-TIPO-AAMMDDHHMM[-MATRICULA].
     A sigla TIPO vem de <body data-tipo="ATA">, e nao do primeiro
     codigo encontrado no texto — um documento pode citar outros
     (a transcricao cita a ata a que pertence, por exemplo).
     CONTEXTO (rotulo do tipo de encontro/parceria, ex. "1to1",
     "indicacao") fica entre "BPL-" e a sigla — casar com [a-z0-9]+
     minusculo para nao confundir com a propria sigla (maiuscula). */
  function nomeArquivo() {
    var tipo = document.body.getAttribute("data-tipo");
    var re = new RegExp("BPL-[a-z0-9]+-" + (tipo || "[A-Z]{2,4}") + "-[\\w-]+");
    var m = document.body.innerText.match(re);
    return m ? m[0] : "BPlen-Documento";
  }

  /* Clone sem barra de apoio, sem scripts e sem as marcacoes
     amarelas de placeholder — preservando classes de estilo que
     convivem no mesmo elemento (selo de circulacao, quadros). */
  function documentoLimpo() {
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll(".nao-imprime, script").forEach(function (n) {
      n.remove();
    });
    clone.querySelectorAll(".ph").forEach(function (n) {
      n.classList.remove("ph", "ph--bloco");
      if (!n.classList.length) n.removeAttribute("class");
    });
    return clone;
  }

  function baixar(blob, nome) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /* ---------------------------------------------------------
     PDF — caixa de impressao do navegador.
     Margens "Nenhuma" e "Graficos de plano de fundo" ativado.
     --------------------------------------------------------- */
  function exportarPdf() {
    window.print();
  }

  /* ---------------------------------------------------------
     HTML — arquivo unico, CSS embutido, imagens em base64.
     Funciona offline e fora desta pasta.
     --------------------------------------------------------- */
  function exportarHtml() {
    var clone = documentoLimpo();

    var css = "";
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var regras = document.styleSheets[i].cssRules;
        for (var j = 0; j < regras.length; j++) css += regras[j].cssText + "\n";
      } catch (e) {
        /* folha externa sem acesso de leitura — ignorar */
      }
    }
    clone.querySelectorAll("link[rel=stylesheet]").forEach(function (n) {
      n.remove();
    });
    var estilo = document.createElement("style");
    estilo.textContent = css;
    clone.querySelector("head").appendChild(estilo);

    var originais = document.querySelectorAll("img");
    var copias = clone.querySelectorAll("img");
    for (var k = 0; k < originais.length; k++) {
      try {
        var c = document.createElement("canvas");
        c.width = originais[k].naturalWidth;
        c.height = originais[k].naturalHeight;
        c.getContext("2d").drawImage(originais[k], 0, 0);
        copias[k].src = c.toDataURL("image/png");
      } catch (e) {
        /* imagem nao conversivel — mantem o caminho relativo */
      }
    }

    baixar(
      new Blob(["<!doctype html>\n" + clone.outerHTML], {
        type: "text/html;charset=utf-8",
      }),
      nomeArquivo() + ".html"
    );
  }

  /* ---------------------------------------------------------
     Word — .doc interpretado pelo Word, Google Docs e
     LibreOffice. Folha A4 com margens reais; o texto flui entre
     paginas, entao a contagem pode diferir do PDF.
     --------------------------------------------------------- */
  var ESTILO_WORD =
    "@page{size:21cm 29.7cm;margin:2cm 2cm 1.8cm 2cm}" +
    "body{font-family:Georgia,'Times New Roman',serif;font-size:11pt;line-height:1.5;color:#0d0d0d}" +
    ".folha{page-break-after:always;width:auto;height:auto;padding:0;margin:0;display:block;box-shadow:none}" +
    ".folha--escura{background:#0d0d0d;color:#fff;padding:1.5cm}" +
    ".capa__circulo,.barra-apoio{display:none}" +
    ".capa__titulo{font-size:26pt;color:#fff;margin:0.6cm 0}" +
    ".capa__tipo{font-family:Arial,sans-serif;font-size:9pt;letter-spacing:3pt;color:#f2be05}" +
    ".capa__subtitulo{font-style:italic;color:#ddd}" +
    ".h1-doc{font-size:19pt;color:#044159;margin:0 0 0.3cm}" +
    ".h2-doc{font-size:14pt;color:#044159;border-bottom:1pt solid #044159;padding-bottom:3pt;margin:0.5cm 0 0.3cm}" +
    ".h3-doc{font-size:11.5pt;margin:0.3cm 0 0.15cm}" +
    ".rotulo,.capa__campo-rotulo{font-family:Arial,sans-serif;font-size:7.5pt;letter-spacing:1pt;text-transform:uppercase;color:#6b6b70}" +
    ".campo__valor,.capa__campo-valor,.valor{font-family:Arial,sans-serif;font-size:10pt}" +
    ".secao__indice{font-family:Arial,sans-serif;font-size:8pt;letter-spacing:1.5pt;color:#9c389d;font-weight:bold}" +
    ".tabela{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:9pt}" +
    ".tabela th{background:#044159;color:#fff;padding:5pt;text-align:left;font-size:8pt}" +
    ".tabela td{padding:5pt;border-bottom:0.5pt solid #ccc;vertical-align:top}" +
    ".quadro{background:#f6f8f9;border-left:3pt solid #044159;padding:8pt;margin:6pt 0}" +
    ".quadro--realce{background:#f2e7f2;border-left-color:#9c389d}" +
    ".quadro--neutro{background:#faf9f7;border-left-color:#9a9aa0}" +
    ".quadro--atencao{background:#fdf5db;border-left-color:#f2be05}" +
    ".nota{font-family:Arial,sans-serif;font-size:8.5pt;color:#3a3a3d}" +
    ".status{font-family:Arial,sans-serif;font-size:8pt;font-weight:bold}" +
    ".assinatura__linha{border-bottom:0.5pt solid #000;height:1.1cm;margin-top:0.8cm}" +
    ".assinatura__nome{font-family:Arial,sans-serif;font-size:10pt;font-weight:bold}" +
    ".assinatura__papel{font-family:Arial,sans-serif;font-size:8.5pt;color:#6b6b70}" +
    ".grade-campos{width:100%}.grade-campos>div{display:inline-block;width:31%;vertical-align:top;margin:0 1% 0.4cm 0}" +
    ".contracapa__frase{font-size:14pt;font-style:italic;color:#fff}" +
    ".contracapa__contatos,.contracapa__aviso{font-family:Arial,sans-serif;font-size:9pt;color:#eee}" +
    ".cabecalho{border-bottom:0.5pt solid #ccc;padding-bottom:4pt;margin-bottom:0.4cm}" +
    ".cabecalho__logo{width:2.6cm}.capa__logo{width:5cm}" +
    ".rodape{border-top:0.5pt solid #ddd;padding-top:4pt;margin-top:0.5cm;font-family:Arial,sans-serif;font-size:7.5pt;color:#9a9aa0}" +
    "ul{margin:0 0 0 0.5cm;padding:0}li{margin-bottom:4pt}" +
    /* Transcricao: bloco de fala vira tabela de duas colunas,
       que e o que o Word entende de forma confiavel. */
    ".fala{width:100%;margin-bottom:6pt}" +
    ".fala__quem{font-family:Arial,sans-serif;font-size:8.5pt;font-weight:bold;color:#044159}" +
    ".fala__tempo{font-weight:normal;color:#9a9aa0;font-size:7.5pt}" +
    ".fala__texto{font-size:10pt;border-left:1pt solid #ddd;padding-left:6pt;margin-top:2pt}" +
    ".marca-tempo{font-family:Arial,sans-serif;font-size:7.5pt;font-weight:bold;letter-spacing:1pt;text-transform:uppercase;color:#9a9aa0;border-top:0.5pt solid #ddd;padding-top:4pt;margin:0.4cm 0 0.2cm}";

  function exportarWord() {
    var clone = documentoLimpo();
    clone.querySelectorAll("link[rel=stylesheet], style").forEach(function (n) {
      n.remove();
    });

    /* Caminho absoluto para os logos. Ao abrir no Word e salvar
       como .docx, as imagens sao embutidas no arquivo. */
    var base = location.href.replace(/[^/]*$/, "");
    clone.querySelectorAll("img").forEach(function (n) {
      n.setAttribute("src", new URL(n.getAttribute("src"), base).href);
    });

    var doc =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">' +
      "<title>" +
      nomeArquivo() +
      "</title><style>" +
      ESTILO_WORD +
      "</style></head><body>" +
      clone.querySelector("body").innerHTML +
      "</body></html>";

    baixar(
      new Blob(["﻿" + doc], { type: "application/msword;charset=utf-8" }),
      nomeArquivo() + ".doc"
    );
  }

  window.exportarPdf = exportarPdf;
  window.exportarWord = exportarWord;
  window.exportarHtml = exportarHtml;
})();
