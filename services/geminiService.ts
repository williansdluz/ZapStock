import { GoogleGenAI, Type } from "@google/genai";
import { AIOrderParseResult } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const parseWhatsAppMessage = async (message: string): Promise<AIOrderParseResult | null> => {
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise a seguinte mensagem de pedido via WhatsApp e extraia os dados estruturados.
      A mensagem é: "${message}"
      
      Tente identificar:
      - Nome do cliente
      - Endereço completo (se houver)
      - Número de WhatsApp ou telefone (se houver)
      - Palavras-chave do produto desejado
      - Quantidade desejada (se for um número solto perto de palavras de produto, assuma que é a quantidade. Se não houver, assuma 1)
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: "Nome do cliente extraído" },
            customerAddress: { type: Type.STRING, description: "Endereço completo de entrega" },
            customerPhone: { type: Type.STRING, description: "Número de telefone ou whatsapp" },
            productKeywords: { type: Type.STRING, description: "Termos chave que identificam o produto" },
            quantity: { type: Type.NUMBER, description: "Quantidade de itens pedidos" },
          },
          required: ["quantity"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AIOrderParseResult;

  } catch (error) {
    console.error("Error parsing message with Gemini:", error);
    return null;
  }
};
