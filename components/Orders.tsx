import React, { useState } from 'react';
import { Customer, Product, Order, OrderStatus } from '../types';
import { parseWhatsAppMessage } from '../services/geminiService';
import { Plus, Loader2, CheckCircle, MessageCircle, FileText, DollarSign, Wallet, CreditCard, Truck } from 'lucide-react';

interface OrdersProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  onAddOrder: (order: Omit<Order, 'id' | 'status' | 'date' | 'isPaid'>) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onTogglePayment: (id: string) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer; // Returns created customer
}

export const Orders: React.FC<OrdersProps> = ({ 
  orders, 
  customers, 
  products, 
  onAddOrder, 
  onUpdateStatus,
  onTogglePayment,
  onAddCustomer
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'shipped'>('all');
  
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // AI State
  const [aiInput, setAiInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleSmartPaste = async () => {
    if (!aiInput.trim()) return;
    setIsProcessing(true);
    setAiError('');

    try {
      const result = await parseWhatsAppMessage(aiInput);
      
      if (result) {
        // 1. Try to match Customer
        let customerIdMatch = '';
        if (result.customerName) {
           const match = customers.find(c => c.name.toLowerCase().includes(result.customerName!.toLowerCase()));
           if (match) customerIdMatch = match.id;
        }

        if (!customerIdMatch && result.customerName && result.customerPhone) {
            const newCust = onAddCustomer({
                name: result.customerName,
                whatsapp: result.customerPhone,
                address: result.customerAddress || 'Endereço pendente'
            });
            customerIdMatch = newCust.id;
        }

        if (customerIdMatch) setSelectedCustomerId(customerIdMatch);

        // 2. Try to match Product
        if (result.productKeywords) {
          const productMatch = products.find(p => 
            p.name.toLowerCase().includes(result.productKeywords!.toLowerCase()) && p.status === 'active'
          );
          if (productMatch) setSelectedProductId(productMatch.id);
        }

        // 3. Set Quantity
        if (result.quantity) setQuantity(result.quantity);

        // 4. Set Notes
        if (result.customerAddress && !customerIdMatch) {
            setNotes(`Endereço extraído: ${result.customerAddress}`);
        }
      } else {
        setAiError("Não foi possível entender o pedido. Tente preencher manualmente.");
      }
    } catch (e) {
      setAiError("Erro ao processar com IA.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedProductId) return;

    onAddOrder({
      customerId: selectedCustomerId,
      productId: selectedProductId,
      quantity,
      notes
    });

    setSelectedCustomerId('');
    setSelectedProductId('');
    setQuantity(1);
    setNotes('');
    setAiInput('');
    setIsModalOpen(false);
  };

  const handleWhatsAppAction = (order: Order, customer: Customer, product: Product, type: 'payment' | 'label' | 'shipped') => {
    const cleanPhone = customer.whatsapp.replace(/\D/g, '');
    let message = '';
    const totalValue = product.price ? (product.price * order.quantity).toFixed(2) : 'A calcular';

    if (type === 'payment') {
      message = `Olá *${customer.name}*! 👋\n\n`;
      message += `Confirmei seu pedido de:\n📦 ${product.name} (x${order.quantity})\n`;
      message += `💰 *Total: R$ ${totalValue}*\n\n`;
      message += `Por favor, faça o pagamento e me envie o comprovante para liberarmos sua caixa! ✅`;
    } else if (type === 'label') {
      message = `Opa ${customer.name}! Pagamento confirmado ✅\n\n`;
      message += `Agora preciso da sua *Etiqueta de Envio* (PDF) para despachar sua caixa.\n`;
      message += `Pode me mandar por aqui?`;
    } else if (type === 'shipped') {
        message = `Oi ${customer.name}, ótima notícia! 🚚💨\n\nSeu pedido já foi enviado. Obrigado pela preferência!`;
    }

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending') return o.status === OrderStatus.PENDING || o.status === OrderStatus.LABEL_GENERATED;
    if (activeTab === 'shipped') return o.status === OrderStatus.SHIPPED || o.status === OrderStatus.DELIVERED;
    return true;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Pedidos</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto">
        <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            Todos os Pedidos
        </button>
        <button 
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            Pendentes
        </button>
        <button 
            onClick={() => setActiveTab('shipped')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'shipped' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            Enviados
        </button>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">Nenhum pedido encontrado nesta categoria.</p>
            </div>
        ) : (
            filteredOrders.map(order => {
                const customer = customers.find(c => c.id === order.customerId);
                const product = products.find(p => p.id === order.productId);
                const total = product?.price ? product.price * order.quantity : 0;

                if (!customer || !product) return null;

                return (
                    <div key={order.id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col md:flex-row justify-between gap-4 transition-all ${order.isPaid ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                {order.isPaid && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCircle size={10} /> Pago</span>}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                                {product.name} <span className="font-semibold text-gray-900">x{order.quantity}</span>
                                {total > 0 && <span className="text-gray-400 ml-2"> (R$ {total.toFixed(2)})</span>}
                            </p>
                            {order.notes && <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded inline-block max-w-md border border-gray-100">{order.notes}</p>}
                            
                            {/* Workflow Actions */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {!order.isPaid ? (
                                    <button 
                                        onClick={() => handleWhatsAppAction(order, customer, product, 'payment')}
                                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Wallet size={14} />
                                        Cobrar Pagamento
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleWhatsAppAction(order, customer, product, 'label')}
                                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <MessageCircle size={14} />
                                        Pedir Etiqueta
                                    </button>
                                )}
                                
                                {order.status === OrderStatus.LABEL_GENERATED && (
                                     <button 
                                        onClick={() => handleWhatsAppAction(order, customer, product, 'shipped')}
                                        className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Truck size={14} />
                                        Avisar Envio
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                            
                            {/* Payment Toggle */}
                            <button
                                onClick={() => onTogglePayment(order.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium w-full sm:w-auto justify-center transition-colors
                                    ${order.isPaid 
                                        ? 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200' 
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                title={order.isPaid ? "Marcar como não pago" : "Marcar como pago"}
                            >
                                <DollarSign size={16} />
                                {order.isPaid ? "Pago" : "Pendente"}
                            </button>

                            <div className="flex flex-col gap-1 w-full sm:w-auto">
                                <select 
                                    value={order.status}
                                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                                    className={`text-sm rounded-lg border-0 py-2 pl-3 pr-8 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 w-full
                                        ${order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-700 ring-yellow-200' : 
                                          order.status === OrderStatus.LABEL_GENERATED ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                                          order.status === OrderStatus.SHIPPED ? 'bg-purple-50 text-purple-700 ring-purple-200' : 
                                          'bg-gray-50 text-gray-700 ring-gray-200'}`}
                                >
                                    {Object.values(OrderStatus).map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-scale-in my-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Novo Pedido</h3>
            
            {/* AI Input Section */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2 text-green-800 font-medium">
                    <MessageCircle className="w-4 h-4" />
                    <span>Copiar pedido do WhatsApp</span>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row">
                    <textarea 
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder='Cole a mensagem aqui. Ex: "Quero 2 caixas de meia, sou a Ana da Rua X"'
                        className="flex-1 text-sm border border-green-200 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                        rows={3}
                    />
                    <button 
                        onClick={handleSmartPaste}
                        disabled={isProcessing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex flex-col items-center justify-center min-w-[100px]"
                    >
                        {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="text-sm font-medium">Processar Texto</span>}
                    </button>
                </div>
                {aiError && <p className="text-red-500 text-xs mt-2">{aiError}</p>}
                {selectedCustomerId && !isProcessing && aiInput && !aiError && (
                    <p className="text-green-600 text-xs mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Dados extraídos com sucesso! Verifique abaixo.
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select
                      required
                      value={selectedCustomerId}
                      onChange={e => setSelectedCustomerId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="">Selecione um cliente...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.whatsapp})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                    <select
                      required
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="">Selecione uma caixa/lote...</option>
                      {products.filter(p => p.status === 'active').map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name} (Disp: {p.remainingQuantity})
                        </option>
                      ))}
                    </select>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                     <input
                        type="text"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Ex: Entrega urgente"
                     />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium shadow-md"
                >
                  Confirmar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};