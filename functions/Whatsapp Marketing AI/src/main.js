import { GoogleGenAI } from '@google/genai';

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') {
    return res.empty();
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { customerName, productName, messageType, customSubject, marketingMode } = payload;

    const isProductMode = marketingMode === 'product';

    if (isProductMode && (!productName || !messageType)) {
      return res.json({ error: 'Parâmetros ausentes. Envie productName e messageType.' }, 400);
    } else if (!isProductMode && (!customerName || !messageType)) {
      return res.json({ error: 'Parâmetros ausentes. Envie customerName e messageType.' }, 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      log('GEMINI_API_KEY ausente. Usando fallback default.');
      return res.json({
        message: getFallbackMessage(isProductMode ? productName : customerName, messageType, customSubject, isProductMode)
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = getPromptForType(isProductMode ? productName : customerName, messageType, customSubject, isProductMode);

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    
    let resultText = '';
    let success = false;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        log(`Tentando gerar com o modelo: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt
        });

        resultText = response.text;
        success = true;
        break;
      } catch (e) {
        log(`Falha ao usar o modelo ${modelName}: ${e.message}`);
        lastError = e;
      }
    }

    if (!success) {
      throw lastError || new Error('Nenhum modelo do Gemini funcionou.');
    }

    return res.json({ message: resultText.trim() });

  } catch (err) {
    error('Erro ao gerar mensagem via Gemini: ' + err.message);
    const isProd = req.body?.marketingMode === 'product';
    return res.json({
      error: 'Falha na IA',
      message: getFallbackMessage(
        isProd ? (req.body?.productName || 'Produto') : (req.body?.customerName || 'Cliente'),
        req.body?.messageType || 'generic',
        req.body?.customSubject,
        isProd
      )
    }, 500);
  }
};

function getPromptForType(name, type, customSubject, isProductMode) {
  if (isProductMode) {
    const baseRules = `Você é um especialista em vendas e marketing de uma loja de cosméticos.
Escreva um anúncio curto, persuasivo e focado em conversão (1 ou 2 parágrafos) para vender o produto "${name}".
Regras de formatação:
- Use emojis que chamem atenção.
- Use gatilhos mentais de escassez e urgência.
- Use a formatação nativa do WhatsApp: *para negrito* e _para itálico_.
- Não inclua placeholders (como [Seu Nome], [Preço] ou [Nome da Loja]). Faça o texto focado no benefício e no produto em si, deixando espaço para a loja complementar se quiser.
- Seja enérgico e envolvente.

Objetivo do anúncio: `;

    switch (type) {
      case 'clearance':
        return `${baseRules}É uma "Queima de Estoque"! O produto está perto do vencimento ou sendo descontinuado, então o desconto é absurdo para zerar o estoque hoje.`;
      case 'unmissable':
        return `${baseRules}É uma "Oferta Imperdível"! Um produto muito desejado que entrou em uma promoção relâmpago surpresa e o estoque vai acabar rápido.`;
      case 'news':
        return `${baseRules}É uma "Novidade Exclusiva"! O produto acabou de chegar na loja e queremos gerar desejo extremo para ser o primeiro a comprar.`;
      default:
        if (customSubject) {
          return `${baseRules}O tema central é: "${customSubject}". Desenvolva o anúncio de vendas com base nisso.`;
        }
        return `${baseRules}Crie um anúncio focado nos benefícios incríveis que esse produto traz para quem o usa.`;
    }
  }

  // Customer Mode logic (default)
  const firstName = name.split(' ')[0];
  const baseRules = `Você é uma atendente simpática e amigável de uma loja de cosméticos.
Escreva uma mensagem curta de WhatsApp (1 ou 2 parágrafos no máximo) para a cliente chamada ${firstName}.
Regras de formatação:
- Use emojis apropriados e com moderação.
- Use a formatação nativa do WhatsApp quando útil: *para negrito*, _para itálico_, e ~para tachado~.
- Não inclua placeholders (como [Seu Nome] ou [Nome da Loja]). Finalize a mensagem de forma fofa.
- Seja direta e cordial.

Objetivo da mensagem: `;

  switch (type) {
    case 'birthday':
      return `${baseRules}Dê os parabéns pelo aniversário dela, desejando coisas boas e a convidando para passar na loja para comemorar com a gente.`;
    case 'news':
      return `${baseRules}Avise que acabaram de chegar novidades e produtos incríveis na loja, convidando-a para vir dar uma olhadinha.`;
    case 'missing':
      return `${baseRules}Diga que estamos com saudades dela, pois faz um tempo que não aparece na loja, e a convide para nos visitar.`;
    case 'promotion':
      return `${baseRules}Avise que estamos com promoções especiais preparadas para ela e a convide para conferir os descontos.`;
    case 'thanks':
      return `${baseRules}Agradeça de forma muito especial e carinhosa pela última compra/visita da cliente em nossa loja, reforçando o quanto ela é importante para nós.`;
    default:
      if (customSubject) {
        return `${baseRules}O assunto central da mensagem é: "${customSubject}". Desenvolva uma mensagem baseada nesse assunto com o tom da loja.`;
      }
      return `${baseRules}Dê um oi simpático e se coloque à disposição.`;
  }
}

function getFallbackMessage(name, type, subject, isProductMode) {
  if (isProductMode) {
    switch (type) {
      case 'clearance':
        return `🔥 QUEIMA DE ESTOQUE: *${name}* 🔥\nÚltimas unidades com um desconto surreal para zerar o estoque! Não perca a chance de garantir o seu antes que acabe. Corre pra loja! 🏃‍♀️💨`;
      case 'unmissable':
        return `🚨 OFERTA IMPERDÍVEL 🚨\nO seu favorito *${name}* está em promoção relâmpago! Estoque limitadíssimo. Aproveite agora mesmo! ✨💖`;
      case 'news':
        return `✨ NOVIDADE EXCLUSIVA ✨\nAcabou de chegar: *${name}*! A sensação do momento já está disponível aqui na loja. Venha ser uma das primeiras a garantir! 🛍️😍`;
      default:
        return `✨ O produto *${name}* é simplesmente perfeito para você! Aproveite essa oportunidade incrível e venha buscar o seu. 🥰`;
    }
  }

  // Customer Mode logic (default)
  const firstName = name ? name.split(' ')[0] : 'Cliente';
  switch (type) {
    case 'birthday':
      return `Parabéns, *${firstName}*! Desejamos a você um feliz aniversário repleto de realizações! Passe aqui na loja para comemorar com a gente! 🎉🎁`;
    case 'news':
      return `Oi, *${firstName}*! Chegaram os novos produtos que você adora! Vem conferir as novidades aqui na loja. ✨💖`;
    case 'missing':
      return `Oi, *${firstName}*! Estamos com saudades de você por aqui! Apareça qualquer dia para ver as novidades e bater um papo. 🥰`;
    case 'promotion':
      return `Oi, *${firstName}*! Preparamos umas promoções *super especiais* pra você. Vem aproveitar os nossos descontos! 🛍️🤑`;
    case 'thanks':
      return `Olá, *${firstName}*! Tudo bem? Passando para agradecer pela sua última visita aqui na loja. Ficamos muito felizes em ter você como cliente! 🥰💖`;
    default:
      if (subject) {
        return `Olá, *${firstName}*! Tudo bem? Passando para falar sobre: ${subject}. 😊`;
      }
      return `Olá, *${firstName}*! Tudo bem? Passando para deixar um oi e nos colocar à disposição! 😊`;
  }
}
