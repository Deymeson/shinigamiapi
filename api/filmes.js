import cheerio from 'cheerio';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const url = 'https://anipixel.app/';

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const filmesInfoList = [];

    const filmesDiv = $('div.topList.mb-3.px-1').filter((_, el) => {
      return $(el).find('h5').text().toLowerCase().includes('filmes');
    }).first();

    if (filmesDiv.length > 0) {
      const filmesElements = filmesDiv.parent().find('div.swiper-slide.item.poster');

      filmesElements.each((_, el) => {
        const item = $(el);
        const link = item.find('a.btn.free.fw-bold').attr('href') || '';

        const tags = item.find('p.tags span');
        let tipo = '';
        let duracao = '';
        let ano = '';
        let imdb = '';

        if (tags.length > 0) {
          const primeiraTag = $(tags[0]).text();
          if (primeiraTag.toLowerCase().includes('temporadas')) {
            tipo = 'anime';
            duracao = primeiraTag;
            ano = tags.eq(1).text() || '';
          } else if (primeiraTag.toLowerCase().includes('min')) {
            tipo = 'filme';
            duracao = primeiraTag;
            ano = tags.eq(1).text() || '';
          }
        }

        tags.each((_, tag) => {
          const txt = $(tag).text();
          if (txt.toLowerCase().includes('imdb')) {
            imdb = txt;
          }
        });

        const capaStyle = item.find('div.content').attr('style') || '';
        const capa = capaStyle.split('url(')[1]?.split(')')[0]?.replace(/"/g, '') || '';

        const titulo = item.find('h6').text().trim();

        filmesInfoList.push({
          link,
          titulo,
          capa,
          imdb,
          ano,
          duracao,
          tipo
        });
      });

      res.status(200).json(filmesInfoList);
    } else {
      res.status(404).json({ erro: 'Seção de filmes não encontrada.' });
    }

  } catch (e) {
    res.status(500).json({ erro: 'Erro ao acessar ou processar a página de filmes.' });
  }
                         }
