import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Archive, Box, Share2, Copy, Check, CheckCircle2 } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'remainingQuantity' | 'status'>) => void;
  onArchiveProduct: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onArchiveProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', totalQuantity: 100, price: 0, description: '' });
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct(newProduct);
    setNewProduct({ name: '', totalQuantity: 100, price: 0, description: '' });
    setIsModalOpen(false);
  };

  const activeProducts = products.filter(p => p.status === 'active');

  const handleShareToWhatsApp = () => {
    let message = "*📦 ESTOQUE DISPONÍVEL - ATUALIZAÇÃO 📦*\n\n";
    
    if (activeProducts.length === 0) {
      message += "_Nenhum produto disponível no momento._";
    } else {
      activeProducts.forEach(p => {
        if (p.remainingQuantity > 0) {
            message += `🔹 *${p.name}*\n`;
            message += `   Restam: ${p.remainingQuantity} unid\n`;
            if (p.price && p.price > 0) message += `   💰 Valor: R$ ${p.price.toFixed(2)}\n`;
            message += "\n";
        }
      });
      message += "👇 *Responda essa mensagem para reservar!*";
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = () => {
    let message = "*📦 ESTOQUE DISPONÍVEL - ATUALIZAÇÃO 📦*\n\n";
    activeProducts.forEach(p => {
        if (p.remainingQuantity > 0) {
            message += `🔹 *${p.name}*\n`;
            message += `   Restam: ${p.remainingQuantity} unid\n`;
            if (p.price && p.price > 0) message += `   💰 Valor: R$ ${p.price.toFixed(2)}\n`;
            message += "\n";
        }
    });
    message += "👇 *Responda essa mensagem para reservar!*";
    
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Estoque de Produtos</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <button
            onClick={copyToClipboard}
            className="flex-1 sm:flex-none bg-white border border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            title="Copiar lista para colar no grupo"
            >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span className="hidden sm:inline">Copiar Lista</span>
            </button>

            <button
            onClick={handleShareToWhatsApp}
            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
            <Share2 size={20} />
            <span className="hidden sm:inline">Divulgar no Zap</span>
            <span className="sm:hidden">Divulgar</span>
            </button>

            <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Caixa</span>
            <span className="sm:hidden">Novo</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeProducts.map(product => {
          const progress = (product.remainingQuantity / product.totalQuantity) * 100;
          const isComplete = product.remainingQuantity === 0;
          
          return (
            <div key={product.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${isComplete ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'}`}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${isComplete ? 'bg-green-100' : 'bg-indigo-50'}`}>
                    {isComplete ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Box className="w-6 h-6 text-indigo-600" />}
                  </div>
                  <button 
                    onClick={() => onArchiveProduct(product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Arquivar Produto"
                  >
                    <Archive size={18} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description || 'Sem descrição'}</p>
                
                {isComplete ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
                        <p className="text-green-800 font-bold text-sm">CAIXA COMPLETA! 🎉</p>
                        <p className="text-green-600 text-xs">Pode iniciar cobranças</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Disponível:</span>
                        <span className="font-semibold text-gray-900">{product.remainingQuantity} / {product.totalQuantity}</span>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                        className={`h-2.5 rounded-full ${progress < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    </div>
                )}

                <div className="pt-2 flex justify-between items-center text-sm border-t border-gray-100 mt-2">
                    <span className="text-gray-500">Preço Un.</span>
                    <span className="font-semibold text-gray-900">
                      {product.price ? `R$ ${product.price.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Adicionar Novo Lote</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto / Caixa</label>
                <input
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: Camisetas Brancas - Caixa 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Total</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newProduct.totalQuantity}
                  onChange={e => setNewProduct({...newProduct, totalQuantity: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  rows={3}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};