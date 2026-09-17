import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Product = { id: string; name: string; category: string; price: number; unit: string; emoji: string };
type CartItem = Product & { qty: number };
type Order = { id: string; items: CartItem[]; total: number; address: string; status: string; createdAt: string };

const PRODUCTS: Product[] = [
  { id: '1', name: 'Fresh Chicken', category: 'Chicken', price: 220, unit: '1 kg', emoji: '🍗' },
  { id: '2', name: 'Chicken Curry Cut', category: 'Chicken', price: 240, unit: '1 kg', emoji: '🍖' },
  { id: '3', name: 'Chicken Breast', category: 'Boneless', price: 320, unit: '1 kg', emoji: '🥩' },
  { id: '4', name: 'Chicken Wings', category: 'Chicken', price: 280, unit: '1 kg', emoji: '🍗' },
  { id: '5', name: 'Chicken Liver', category: 'Special', price: 160, unit: '500 g', emoji: '🥩' },
  { id: '6', name: 'Chicken Drumsticks', category: 'Chicken', price: 290, unit: '1 kg', emoji: '🍗' },
];

const CATEGORIES = ['All', 'Chicken', 'Boneless', 'Special'];

export default function App() {
  const [screen, setScreen] = useState<'home' | 'cart' | 'orders' | 'profile' | 'admin'>('home');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [address, setAddress] = useState('');
  const [shopOpen, setShopOpen] = useState(true);

  useEffect(() => {
    (async () => {
      const savedCart = await AsyncStorage.getItem('cart');
      const savedOrders = await AsyncStorage.getItem('orders');
      const savedShop = await AsyncStorage.getItem('shopOpen');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedShop) setShopOpen(savedShop === 'true');
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { AsyncStorage.setItem('orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { AsyncStorage.setItem('shopOpen', String(shopOpen)); }, [shopOpen]);

  const filtered = useMemo(() => PRODUCTS.filter((p) => {
    const matchesCategory = category === 'All' || p.category === category;
    const text = `${p.name} ${p.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [category, query]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const addToCart = (product: Product) => {
    if (!shopOpen) return Alert.alert('Shop Closed', 'Please try again when the shop is open.');
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => setCart((current) => current.flatMap((item) => {
    if (item.id !== id) return [item];
    const qty = item.qty + delta;
    return qty > 0 ? [{ ...item, qty }] : [];
  }));

  const placeOrder = () => {
    if (!cart.length) return Alert.alert('Cart Empty', 'Add products before checkout.');
    if (!address.trim()) return Alert.alert('Address Required', 'Please enter your delivery address.');
    const order: Order = {
      id: `CF-${Date.now().toString().slice(-6)}`,
      items: cart,
      total,
      address: address.trim(),
      status: 'Pending',
      createdAt: new Date().toLocaleString(),
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    setAddress('');
    setScreen('orders');
    Alert.alert('Order Placed', `Your order ${order.id} has been placed.`);
  };

  const updateOrderStatus = (id: string, status: string) => setOrders((current) => current.map((o) => o.id === id ? { ...o, status } : o));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>CHICKEN FRESH</Text>
          <Text style={styles.tagline}>Fresh. Clean. Delivered.</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: shopOpen ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[styles.statusText, { color: shopOpen ? '#166534' : '#991b1b' }]}>{shopOpen ? 'OPEN' : 'CLOSED'}</Text>
        </View>
      </View>

      {screen === 'home' && <>
        <View style={styles.searchBox}><TextInput value={query} onChangeText={setQuery} placeholder="Search chicken, breast, wings..." style={styles.input} /></View>
        <FlatList horizontal data={CATEGORIES} keyExtractor={(x) => x} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setCategory(item)} style={[styles.category, category === item && styles.categoryActive]}>
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
          </TouchableOpacity>
        )} />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => <View style={styles.card}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.unit}>{item.unit}</Text>
            <Text style={styles.price}>₹{item.price}</Text>
            <TouchableOpacity onPress={() => addToCart(item)} style={styles.addButton}><Text style={styles.addText}>ADD</Text></TouchableOpacity>
          </View>}
        />
      </>}

      {screen === 'cart' && <View style={styles.panel}>
        <Text style={styles.title}>Your Cart</Text>
        {!cart.length ? <Text style={styles.empty}>Your cart is empty.</Text> : <>
          {cart.map((item) => <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}><Text style={styles.productName}>{item.name}</Text><Text style={styles.unit}>₹{item.price} × {item.qty}</Text></View>
            <View style={styles.qty}><TouchableOpacity onPress={() => changeQty(item.id, -1)}><Text style={styles.qtyBtn}>−</Text></TouchableOpacity><Text style={styles.qtyValue}>{item.qty}</Text><TouchableOpacity onPress={() => changeQty(item.id, 1)}><Text style={styles.qtyBtn}>+</Text></TouchableOpacity></View>
          </View>)}
          <TextInput value={address} onChangeText={setAddress} placeholder="Delivery address" multiline style={[styles.input, styles.address]} />
          <Text style={styles.total}>Total: ₹{total}</Text>
          <TouchableOpacity style={styles.checkout} onPress={placeOrder}><Text style={styles.checkoutText}>PLACE ORDER • CASH ON DELIVERY</Text></TouchableOpacity>
        </>}
      </View>}

      {screen === 'orders' && <View style={styles.panel}><Text style={styles.title}>Order History</Text>{!orders.length ? <Text style={styles.empty}>No orders yet.</Text> : orders.map((order) => <View key={order.id} style={styles.orderCard}><View style={styles.row}><Text style={styles.productName}>{order.id}</Text><Text style={styles.orderStatus}>{order.status}</Text></View><Text style={styles.unit}>{order.createdAt}</Text><Text style={styles.unit}>{order.address}</Text><Text style={styles.price}>₹{order.total}</Text></View>)}</View>}

      {screen === 'profile' && <View style={styles.panel}><Text style={styles.title}>Profile</Text><Text style={styles.profileCard}>Chicken Fresh Customer{`\n`}Cash on Delivery enabled{`\n`}Local app profile using AsyncStorage</Text></View>}

      {screen === 'admin' && <View style={styles.panel}><Text style={styles.title}>Admin Mode</Text><TouchableOpacity onPress={() => setShopOpen((v) => !v)} style={styles.adminButton}><Text style={styles.checkoutText}>{shopOpen ? 'MARK SHOP CLOSED' : 'MARK SHOP OPEN'}</Text></TouchableOpacity>{orders.map((order) => <View key={order.id} style={styles.orderCard}><Text style={styles.productName}>{order.id} • ₹{order.total}</Text><Text style={styles.unit}>{order.address}</Text><View style={styles.statusActions}>{['Pending', 'Confirmed', 'Out for delivery', 'Delivered'].map((status) => <TouchableOpacity key={status} onPress={() => updateOrderStatus(order.id, status)} style={styles.smallButton}><Text style={styles.smallButtonText}>{status}</Text></TouchableOpacity>)}</View></View>)}</View>}

      <View style={styles.nav}>
        {[['home', 'Home'], ['cart', `Cart (${cart.reduce((s, i) => s + i.qty, 0)})`], ['orders', 'Orders'], ['profile', 'Profile'], ['admin', 'Admin']].map(([key, label]) => <TouchableOpacity key={key} onPress={() => setScreen(key as typeof screen)} style={styles.navItem}><Text style={[styles.navText, screen === key && styles.navTextActive]}>{label}</Text></TouchableOpacity>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' }, header: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' }, brand: { fontSize: 22, fontWeight: '900' }, tagline: { color: '#777', marginTop: 2 }, statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }, statusText: { fontWeight: '800', fontSize: 11 }, searchBox: { padding: 14 }, input: { backgroundColor: '#f6f6f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }, categories: { paddingHorizontal: 14, paddingBottom: 10 }, category: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: '#f4f4f5', marginRight: 8 }, categoryActive: { backgroundColor: '#111' }, categoryText: { color: '#444' }, categoryTextActive: { color: '#fff' }, grid: { padding: 14, paddingBottom: 110 }, card: { backgroundColor: '#fafafa', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eee' }, emoji: { fontSize: 40 }, productName: { fontWeight: '800', fontSize: 16 }, unit: { color: '#777', marginTop: 4 }, price: { fontWeight: '900', fontSize: 18, marginTop: 8 }, addButton: { backgroundColor: '#111', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 }, addText: { color: '#fff', fontWeight: '900' }, panel: { flex: 1, padding: 18, paddingBottom: 100 }, title: { fontSize: 26, fontWeight: '900', marginBottom: 15 }, empty: { color: '#777', marginTop: 20 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }, qty: { flexDirection: 'row', alignItems: 'center', gap: 10 }, qtyBtn: { fontSize: 25 }, qtyValue: { fontWeight: '800' }, address: { minHeight: 90, marginTop: 10, textAlignVertical: 'top' }, total: { fontSize: 22, fontWeight: '900', marginTop: 14 }, checkout: { backgroundColor: '#111', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 12 }, checkoutText: { color: '#fff', fontWeight: '900' }, orderCard: { backgroundColor: '#fafafa', padding: 14, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eee' }, orderStatus: { fontWeight: '800' }, profileCard: { backgroundColor: '#fafafa', padding: 18, borderRadius: 14, lineHeight: 25 }, adminButton: { backgroundColor: '#111', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 15 }, statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }, smallButton: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#e5e7eb', borderRadius: 9 }, smallButtonText: { fontSize: 11, fontWeight: '700' }, nav: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', padding: 10, flexDirection: 'row', justifyContent: 'space-around' }, navItem: { padding: 8 }, navText: { color: '#888', fontWeight: '700', fontSize: 12 }, navTextActive: { color: '#111' }
});
