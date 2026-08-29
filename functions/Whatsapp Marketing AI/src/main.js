import { GoogleGenAI } from '@google/genai';

export default async ({ req, res, log, error }) => {
  // Configuração básica do CORS e verificação
  if (req.method === 'OPTIONS') {
    return res.empty();
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { customerName, messageType, customSubject } = payload;

    if (!customerName || !messageType) {
      return res.json({ error: 'Parâmetros ausentes. Envie customerName e messageType.' }, 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      log('GEMINI_API_KEY ausente. Usando fallback default.');
      return res.json({
        message: getFallbackMessage(customerName, messageType, customSubject)
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = getPromptForType(customerName, messageType, customSubject);

    // Prioridade para os modelos mais econômicos (Flash Lite) e rápidos para textos curtos
    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
    
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
        break; // Sucesso, sai do loop
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
    return res.json({
      error: 'Falha na IA',
      message: getFallbackMessage(
        req.body?.customerName || 'Cliente',
        req.body?.messageType || 'generic',
        req.body?.customSubject
      )
    }, 500);
  }
};

function getPromptForType(name, type, customSubject) {
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

function getFallbackMessage(name, type, subject) {
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
