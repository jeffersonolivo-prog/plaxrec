import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { User } from '../types';

interface PlaxAssistantProps {
  user: User;
}

const PlaxAssistant: React.FC<PlaxAssistantProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: `Olá ${user.name}! Sou o PlaxBot. Posso ajudar você a entender como funciona a economia circular do PlaxRec ou analisar seus dados.` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setLoading(true);

    try {
      const apiKey = process.env.API_KEY; 
      // Note: In a real production app, API keys should be handled securely.
      // Assuming process.env.API_KEY is available as per instructions.
      
      if (!apiKey) {
        throw new Error("API Key not found");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const systemContext = `
        Você é o PlaxBot, um assistente virtual especializado na plataforma PlaxRec.
        A PlaxRec é uma fintech de economia circular de plástico.
        
        O fluxo funciona assim:
        1. Coletor vende plástico para Reciclador -> Gera PLAX para Coletor.
        2. Reciclador emite NFe para Transformador -> Destrava créditos PLAX.
        3. Comprador ESG investe dinheiro -> Dinheiro é dividido 25% para cada elo (Coletor, Reciclador, Transformador, Fundo ESG).
        
        O usuário atual é: ${user.name}, Função: ${user.role}.
        Saldo Plax: ${user.balancePlax}. Saldo R$: ${user.balanceBRL}.
        
        Responda de forma curta, prestativa e foque em sustentabilidade e finanças.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: systemContext + "\n\nUser Question: " + userMsg }] }
        ]
      });

      const text = response.text || "Desculpe, não consegui processar sua resposta no momento.";
      
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Erro ao conectar com a inteligência artificial. Verifique a chave de API." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 mb-4 flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-plax-600 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-white">
                <Sparkles size={18} />
                <h3 className="font-semibold">PlaxRec AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-plax-700 rounded p-1">
              <X size={18} />
            </button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-plax-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
                 <div className="flex justify-start">
                 <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm text-sm text-gray-500 italic">
                   Digitando...
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t flex space-x-2">
            <input 
              type="text" 
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plax-500"
              placeholder="Pergunte sobre seus créditos..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
                onClick={handleSend} 
                disabled={loading}
                className="bg-plax-600 text-white p-2 rounded-md hover:bg-plax-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-plax-600 text-white p-4 rounded-full shadow-lg hover:bg-plax-700 transition-all hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default PlaxAssistant;