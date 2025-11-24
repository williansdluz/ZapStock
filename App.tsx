import React, { useState, useEffect } from 'react';
import { Customer, Product, Order, OrderStatus } from './types';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Customers } from './components/Customers';
import { Orders } from './components/Orders';
import { LayoutDashboard, Package, Users, ShoppingCart, Menu, X, LogOut } from 'lucide-react';

const App: React.FC = () => {
  // --- MOCK DATA INITIALIZATION ---
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('zapstock_customers');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Maria Silva', whatsapp: '11999998888', address: 'Rua das Flores, 123, SP', createdAt: new Date().toISOString() },
      { id: '2', name: 'João Santos', whatsapp: '21988887777', address: 'Av Atlantica, 400, RJ', createdAt: new Date().toISOString() }
    ];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('zapstock_products');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Kit Camisetas Básicas (Caixa 01)', totalQuantity: 100, remainingQuantity: 0, price: 25.00, status: 'active' }, // Mocking a completed box
      { id: '2', name: 'Meias Esportivas (Caixa 02)', totalQuantity: 100, remainingQuantity: 85, price: 12.50, status: 'active' }
    ];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('zapstock_orders');
    return saved ? JSON.parse(saved) : [
        { id: '101', customerId: '1', productId: '1', quantity: 10, status: OrderStatus.PENDING, date: new Date().toISOString(), isPaid: true },
        { id: '102', customerId: '2', productId: '2', quantity: 5, status: OrderStatus.PENDING, date: new Date().toISOString(), isPaid: false }
    ];
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'customers' | 'orders'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('zapstock_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('zapstock_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('zapstock_orders', JSON.stringify(orders)); }, [orders]);

  // --- ACTIONS ---

  const addProduct = (product: Omit<Product, 'id' | 'remainingQuantity' | 'status'>) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      remainingQuantity: product.totalQuantity,
      status: 'active'
    };
    setProducts([...products, newProduct]);
  };

  const archiveProduct = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, status: 'archived' } : p));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setCustomers([...customers, newCustomer]);
    return newCustomer;
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'status' | 'date' | 'isPaid'>) => {
    // Check stock
    const product = products.find(p => p.id === orderData.productId);
    if (!product) return;
    if (product.remainingQuantity < orderData.quantity) {
      alert(`Erro: Estoque insuficiente. Restam apenas ${product.remainingQuantity} itens.`);
      return;
    }

    const newOrder: Order = {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
      status: OrderStatus.PENDING,
      date: new Date().toISOString(),
      isPaid: false
    };

    // Update stock
    const updatedProducts = products.map(p => 
      p.id === orderData.productId 
        ? { ...p, remainingQuantity: p.remainingQuantity - orderData.quantity }
        : p
    );

    setOrders([newOrder, ...orders]);
    setProducts(updatedProducts);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const toggleOrderPayment = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, isPaid: !o.isPaid } : o));
  };

  // --- UI HELPERS ---
  const NavItem = ({ view, icon: Icon, label }: any) => (
    <button
      onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
            <Package className="w-8 h-8" />
            ZapStock
          </h1>
          <p className="text-xs text-gray-400 mt-1">Gestão de Grupos WhatsApp</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Visão Geral" />
          <NavItem view="orders" icon={ShoppingCart} label="Pedidos" />
          <NavItem view="inventory" icon={Package} label="Estoque" />
          <NavItem view="customers" icon={Users} label="Clientes" />
        </nav>
        <div className="p-4 border-t border-gray-100">
            <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors px-4 py-2 w-full text-sm">
                <LogOut size={16} />
                <span>Sair</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
           <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
            <Package className="w-6 h-6" />
            ZapStock
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-gray-800 bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-16 left-0 right-0 bg-white shadow-lg p-4 space-y-2" onClick={e => e.stopPropagation()}>
                <NavItem view="dashboard" icon={LayoutDashboard} label="Visão Geral" />
                <NavItem view="orders" icon={ShoppingCart} label="Pedidos" />
                <NavItem view="inventory" icon={Package} label="Estoque" />
                <NavItem view="customers" icon={Users} label="Clientes" />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {currentView === 'dashboard' && <Dashboard products={products} orders={orders} customers={customers} />}
            {currentView === 'inventory' && <Inventory products={products} onAddProduct={addProduct} onArchiveProduct={archiveProduct} />}
            {currentView === 'customers' && <Customers customers={customers} onAddCustomer={addCustomer} />}
            {currentView === 'orders' && <Orders 
                orders={orders} 
                customers={customers} 
                products={products} 
                onAddOrder={addOrder} 
                onUpdateStatus={updateOrderStatus}
                onTogglePayment={toggleOrderPayment}
                onAddCustomer={addCustomer}
            />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;