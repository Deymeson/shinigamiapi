import axios from 'axios';
import cheerio from 'cheerio';

export default async (req, res) => {
  try {
    // Verifica o método HTTP
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Parâmetro "q" é obrigatório',
        exemplo: '/api/search?q=jujutsu+kaisen'
      });
    }

    const searchUrl = `https://anipixel.app/search.php?q=${encodeURIComponent(q)}`;
    
    // Configuração do Axios com timeout e User-Agent
    const { data: html } = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(html);
    const resultados = [];

    $('div.items .item.poster').each((_, item) => {
      const $item = $(item);
      
      try {
        // Título
        const titulo = $item.find('h6').text().trim();
        
        // Imagem
        const style = $item.find('.content').attr('style') || '';
        let imagem = '';
        const match = style.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1]) {
          imagem = match[1];
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
        
        resultados.push({
          titulo,
          capa: imagem,
          link: link.startsWith('http') ? link : `https://anipixel.app${link}`,
          duracao,
          ano,
          imdb,
          tipo
        });
      } catch (error) {
        console.error('Erro ao processar item:', error);
      }
    });
    
    if (resultados.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhum resultado encontrado',
        sugestao: 'Verifique se o termo de busca está correto'
      });
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(resultados);
    
  } catch (error) {
    console.error('Erro completo:', error);
    
    let status = 500;
    let message = 'Erro ao processar a requisição';
    
    if (error.code === 'ECONNABORTED') {
      status = 504;
      message = 'Tempo de requisição excedido';
    } else if (error.response) {
      status = error.response.status;
      message = 'O site retornou um erro';
    }
    
    res.status(status).json({ 
      error: message,
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
