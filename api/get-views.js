// api/get-views.js

const CONFIG = {
    principais: ['j-rlc0o6ILA', 'aP_1McdVF_4', 'OHZHCgU9Y9g', '9kdYCYZtom8', 'CFrrpVBsTWU', 'oyTlY_aK7W0', 'Y5k9pbT9ZQQ'],
    secundarios: ['9c3wOQRGR30', 'l0mNft1jFjI', 'P1aI_WmkqAY', 'XoVvt8Ws12U', '93PezDiU5vc', 'APpxoX_Kueo'],
    ambos: ['NrUluayuOK4', 'YC5jGimSeNo', 'Q72h8lVbNaE']
};

export default async function handler(req, res) {
    // Permite que a Nuvemshop acesse os dados sem bloqueio de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // BLINDAGEM DE COTA MÁXIMA: Trava o resultado na CDN da Vercel por 15 minutos (900 segundos)
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');

    const API_KEY = process.env.YOUTUBE_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: "Chave da API não configurada no servidor." });
    }

    // Une todos os IDs únicos em uma única string separada por vírgulas
    const todosIds = [...CONFIG.principais, ...CONFIG.secundarios, ...CONFIG.ambos];
    const uniqueIdsStr = [...new Set(todosIds)].join(',');

    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${uniqueIdsStr}&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // Mapeia os resultados vindos da API do YouTube
        const viewsMap = {};
        if (data.items) {
            data.items.forEach(v => {
                viewsMap[v.id] = parseInt(v.statistics.viewCount) || 0;
            });
        }

        let totalEsquerda = 0;
        let totalDireita = 0;

        // Soma os valores reais baseados nos arrays do Mundo Torajo
        CONFIG.principais.forEach(id => totalEsquerda += (viewsMap[id] || 0));
        CONFIG.secundarios.forEach(id => totalDireita += (viewsMap[id] || 0));
        CONFIG.ambos.forEach(id => {
            const vAtual = (viewsMap[id] || 0);
            totalEsquerda += vAtual;
            totalDireita += vAtual;
        });

        // Retorna o JSON exato que o seu index.html precisa ler
        return res.status(200).json({ v1: totalEsquerda, v2: totalDireita });

    } catch (error) {
        console.error('Erro nos bastidores da API:', error);
        return res.status(500).json({ error: "Erro interno ao processar views." });
    }
}
