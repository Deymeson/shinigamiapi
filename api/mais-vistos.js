import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const { data: html } = await axios.get('https://anipixel.app/animes');
    const $ = cheerio.load(html);

    const maisVistoDiv = $("div.topList.mb-3.px-1:has(h6:contains('Queridinhos do AniPixel'))").parent();
    const itemElements = maisVistoDiv.find("div.swiper-slide.item.poster");

    const resultado = [];

    itemElements.each((i, el) => {
      const item = $(el);

      const link = item.find("a.btn.free.fw-bold").attr("href") || '';
      const tags = item.find("p.tags span").toArray().map(e => $(e).text());

      let tipo = '', duracao = '', ano = '', imdb = '';

      if (tags.length > 0) {
        const firstTag = tags[0].toLowerCase();
        if (firstTag.includes("temporadas")) {
          tipo = "anime";
          duracao = tags[0];
          ano = tags[1] || "";
        } else if (firstTag.includes("min")) {
          tipo = "filme";
          duracao = tags[0];
          ano = tags[1] || "";
        }
      }

      imdb = tags.find(t => t.toLowerCase().includes("imdb")) || "";

      const capa = item.find("div.content").attr("style")?.match(/url(.*?)/)?.[1] || '';
      const titulo = item.find("h6").text().trim();

      resultado.push({
        link,
        titulo,
        capa,
        imdb,
        ano,
        duracao,
        tipo
      });
    });

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro:", error.message);
    res.status(500).json({ erro: "Falha ao buscar dados." });
  }
}
