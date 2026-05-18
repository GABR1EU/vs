// api/get-views.js

const CONFIG = {
    // Você só precisa de UMA chave aqui, pois ela só rodará 4 vezes por hora
    principais: [
        { id: 'j-rlc0o6ILA', viewsFixas: 300000 },
        { id: 'aP_1McdVF_4', viewsFixas: 250000 },
        { id: 'OHZHCgU9Y9g', viewsFixas: 1200000 },
        { id: '9kdYCYZtom8', viewsFixas: 1200000 },
        { id: 'CFrrpVBsTWU', viewsFixas: 300000 },
        { id: 'oyTlY_aK7W0', viewsFixas: 500000}
    ],
    secundarios: [
        { id: '9c3wOQRGR30', viewsFixas: 900000 },
        { id: 'l0mNft1jFjI', viewsFixas: 850000 },
        { id: 'P1aI_WmkqAY', viewsFixas: 300000 }, 
        { id: 'XoVvt8Ws12U', viewsFixas: 900000 },
        { id: '93PezDiU5vc', viewsFixas: 250000 }
    ],
    ambos: [
        { id: 'NrUluayuOK4', viewsFixas: 400000 }, 
        { id: 'YC5jGimSeNo', viewsFixas: 370000 },
        { id: 'Q72h8lVbNaE', viewsFixas: 400000 }
    ]
};

export default async function handler(req, res) {
    // 1. O SEGREDO DO CACHE: Salva o resultado na CDN da Vercel por 15 minutos (900 segundos)
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite que seu HTML acesse a API

    const API_KEY = process.env.YOUTUBE_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: "Chave da API não configurada no servidor." });
    }

    // Une todos os IDs únicos para fazer uma única chamada ao YouTube
    const todosIds = [
        ...CONFIG.principais.map(v => v.id),
        ...CONFIG.secundarios.map(v => v.id),
        ...CONFIG.ambos.map(v => v.id)
    ];
    const uniqueIdsStr = [...new Set(todosIds)].join(',');

    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${uniqueIdsStr}&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }

        // Mapeia os resultados da API do YouTube
        const viewsMap = {};
        if (data.items) {
            data.items.forEach(v => {
                viewsMap[v.id] = parseInt(v.statistics.viewCount) || 0;
            });
        }

        // Soma os valores (Se a API falhar para algum vídeo ou não trouxer, usa a fixa)
        let totalEsquerda = 0;
        let totalDireita = 0;

        CONFIG.principais.forEach(v => totalEsquerda += (viewsMap[v.id] || v.viewsFixas));
        CONFIG.secundarios.forEach(v => totalDireita += (viewsMap[v.id] || v.viewsFixas));
        CONFIG.ambos.forEach(v => {
            const vAtual = (viewsMap[v.id] || v.viewsFixas);
            totalEsquerda += vAtual;
            totalDireita += vAtual;
        });

        // Retorna o resultado limpo e processado para o seu HTML
        return res.status(200).json({ v1: totalEsquerda, v2: totalDireita });

    } catch (error) {
        return res.status(500).json({ error: "Erro interno ao processar views." });
    }
}
