import cheerio from 'cheerio';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ erro: 'Parâmetro "q" é obrigatório.' });
  }

  const query = q.replace(/\s+/g, '+'); // converte espaços em "+"
  const url = `https://anipixel.app/search.php?q=${query}`;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const resultadoLista = [];

    $('div.items .item.poster').each((_, item) => {
      const el = $(item);
      const titulo = el.find('h6').text().trim();

      const style = el.find('.content').attr('style') || '';
      const imagem = style.includes('url(')
        ? style.split('url(')[1].split(')')[0].replace(/"/g, '')
        : '';

      const link = el.find('a[href].btn.free').attr('href') || '';

      const tags = el.find('.tags span');
      const duracao = tags.eq(0).text() || '';
      const ano = tags.eq(1).text() || '';
      const imdb = tags.eq(2).text().replace('IMDb', '').trim() || '';

      const tipo = duracao.toLowerCase().includes('temporada') ? 'anime' : 'filme';

      resultadoLista.push({
        titulo,
        capa: imagem,
        link,
        duracao,
        ano,
        imdb,
        tipo
      });
    });

    res.status(200).json(resultadoLista);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao acessar o site do Anipixel.' });
  }
}
