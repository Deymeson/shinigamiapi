import axios from 'axios';
import cheerio from 'cheerio';

export default async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
    }

    const searchUrl = `https://anipixel.app/search.php?q=${encodeURIComponent(q)}`;
    const { data: html } = await axios.get(searchUrl);
    
    const $ = cheerio.load(html);
    const items = $('div.items .item.poster');
    
    const resultados = items.map((_, item) => {
      const $item = $(item);
      
      // Título
      const titulo = $item.find('h6').text().trim();
      
      // Imagem
      const style = $item.find('.content').attr('style') || '';
      let imagem = '';
      if (style.includes('url(')) {
        imagem = style.match(/url\((['"]?)(.*?)\1\)/)[2];
      }
      
      // Link
      const link = $item.find('a[href].btn.free').attr('href') || '';
      
      // Tags
      const tags = $item.find('.tags span');
      const duracao = tags.eq(0).text().trim();
      const ano = tags.eq(1).text().trim();
      const imdb = tags.eq(2).text().replace('IMDb', '').trim();
      
      // Tipo
      const tipo = duracao.toLowerCase().includes('temporada') ? 'anime' : 'filme';
      
      return {
        titulo,
        capa: imagem,
        link,
        duracao,
        ano,
        imdb,
        tipo
      };
    }).get();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(resultados);
    
  } catch (error) {
    console.error('Erro ao fazer scraping:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição' });
  }
};
