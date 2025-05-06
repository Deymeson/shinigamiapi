const fetch = require('node-fetch');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const response = await fetch("https://anipixel.app");
    const html = await response.text();
    const $ = cheerio.load(html);

    const filmesDiv = $('div.topList.mb-3.px-1:has(h5:contains("Filmes"))').parent();
    const filmes = [];

    filmesDiv.find('div.swiper-slide.item.poster').each((_, el) => {
      const element = $(el);

      const link = element.find("a.btn.free.fw-bold").attr("href") || "";
      const tags = element.find("p.tags span").toArray().map(tag => $(tag).text());
      const capa = element.find("div.content").attr("style")?.match(/url["']?(.*?)["']?/)?.[1] || "";
      const titulo = element.find("h6").text().trim();

      const tipo = tags[0]?.toLowerCase().includes("temporadas") ? "anime" : "filme";
      const duracao = tags[0] || "";
      const ano = tags[1] || "";
      const imdb = tags.find(t => t.toLowerCase().includes("imdb")) || "";

      filmes.push({ link, titulo, capa, imdb, ano, duracao, tipo });
    });

    res.status(200).json(filmes);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar filmes", detalhes: e.message });
  }
};
