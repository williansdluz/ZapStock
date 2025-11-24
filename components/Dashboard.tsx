import React from 'react';
import { Customer, Order, Product, OrderStatus } from '../types';
import { Package, Users, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  orders: Order[];
  customers: Customer[];
}

export const Dashboard: React.FC<DashboardProps> = ({ products, orders, customers }) => {
  const activeProducts = products.filter(p => p.status === 'active');
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  
  const totalStock = activeProducts.reduce((acc, p) => acc + p.remainingQuantity, 0);
  
  // Calculate potential revenue pending
  const pendingRevenue = orders
    .filter(o => !o.isPaid)
    .reduce((acc, o) => {
        const product = products.find(p => p.id === o.productId);
        return acc + (product?.price ? product.price * o.quantity : 0);
    }, 0);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Pedidos Pendentes" 
          value={pendingOrders.length} 
          icon={ShoppingCart} 
          color="bg-orange-500" 
        />
        <StatCard 
          title="Estoque Atual (Unid)" 
          value={totalStock} 
          icon={Package} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="A Receber" 
          value={`R$ ${pendingRevenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Clientes Totais" 
          value={customers.length} 
          icon={Users} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos com Baixo Estoque</h3>
          {activeProducts.filter(p => p.remainingQuantity < 10).length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum produto com estoque crítico ou fechado.</p>
          ) : (
            <ul className="space-y-3">
              {activeProducts
                .filter(p => p.remainingQuantity < 10)
                .map(p => (
                  <li key={p.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <span className="text-gray-700">{p.name}</span>
                    <span className={`font-bold px-2 py-1 rounded text-xs ${p.remainingQuantity === 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                      {p.remainingQuantity === 0 ? 'COMPLETA' : `Restam ${p.remainingQuantity}`}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimos Pedidos</h3>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum pedido registrado.</p>
          ) : (
            <ul className="space-y-3">
              {orders.slice(0, 5).map(o => {
                const customer = customers.find(c => c.id === o.customerId);
                const product = products.find(p => p.id === o.productId);
                return (
                  <li key={o.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium block text-gray-800">{customer?.name || 'Cliente Desconhecido'}</span>
                      <div className="flex items-center gap-2">
                         <span className="text-gray-500 text-xs">{product?.name} (x{o.quantity})</span>
                         {o.isPaid && <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-1 rounded">Pago</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${o.status === OrderStatus.PENDING ? 'bg-orange-100 text-orange-700' : 
                        o.status === OrderStatus.SHIPPED ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {o.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};