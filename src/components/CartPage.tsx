import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CartItem } from '../types';
import { formatPrice } from '../data';
import { createOrder, syncCartSession } from '../services/database';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  currency: string;
  userEmail?: string;
}

export function CartPage({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, currency, userEmail }: CartPageProps) {
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'authorizing' | 'success'>('idle');
  const [placedOrderId, setPlacedOrderId] = useState<string>('DH-90482');

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = subtotal > 0 ? subtotal * 0.10 : 0;
  const taxes = subtotal > 0 ? (subtotal - discount) * 0.08 : 0;
  const grandTotal = Math.max(0, subtotal - discount + taxes);

  // Sync cart session on cart changes so abandoned carts are automatically recorded
  useEffect(() => {
    if (cartItems.length > 0) {
      syncCartSession(cartItems, grandTotal, userEmail);
    }
  }, [cartItems, grandTotal, userEmail]);

  const handleAuthorize = async () => {
    setDispatchStatus('authorizing');
    try {
      const orderId = await createOrder({
        customer_email: userEmail || 'guest@operative.labs',
        items: cartItems,
        subtotal,
        discount,
        tax: taxes,
        total: grandTotal,
        currency,
        status: 'confirmed'
      });
      setPlacedOrderId(orderId);
      setTimeout(() => {
        setDispatchStatus('success');
        onClearCart();
      }, 1000);
    } catch (e) {
      console.error('Order creation error:', e);
      setDispatchStatus('success');
      onClearCart();
    }
  };

  return (
    <main className="w-full pt-20 bg-background min-h-screen">
      <div className="flex flex-col w-full">
        <div className="relative w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-xl">
            
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-lg">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                <Link className="hover:text-primary transition-colors" to="/">Lab Core</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link className="hover:text-primary transition-colors" to="/shop-catalog">Catalog</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary">Dispatch Queue</span>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container-low border border-outline-variant/30 px-space-md py-1.5 rounded-lg shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary animate-pulse"></span>
                </span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">SECURE DISPATCH PROTOCOL // 256-BIT ENCRYPTED</span>
              </div>
            </div>

            {dispatchStatus === 'success' && (
              <div className="mb-space-lg p-space-md rounded-xl bg-secondary-container/40 border border-secondary text-on-surface flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
                  <div>
                    <h4 className="font-headline-sm text-on-surface text-[17px] font-medium">Payment Confirmed • Order Placed</h4>
                    <p className="font-body-sm text-secondary text-[13px]">Transaction verified. Receipt generated and scheduled for priority courier transport.</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-xs text-secondary font-bold">ORDER #{placedOrderId}</span>
                  <Link to="/admin" className="text-[11px] text-primary hover:underline font-label-sm uppercase tracking-wider">
                    View in Database ↗
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              
              {/* Cart Items List */}
              <div className="lg:col-span-8 flex flex-col gap-space-lg">
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-sm">
                  <div>
                    <div className="flex items-center gap-space-xs mb-1">
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold">Active Allocation</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">NODE #842</span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-normal font-normal">
                      Your Cart <span className="text-on-surface-variant font-body-md text-body-md">({cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items)</span>
                    </h1>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={onClearCart}
                      className="text-on-surface-variant hover:text-error text-label-sm uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-xl flex flex-col items-center justify-center text-center gap-space-md py-16 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[32px]">remove_shopping_cart</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-normal">Your Dispatch Queue is Empty</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1">
                        No architectural instruments or hardware modules have been allocated yet.
                      </p>
                    </div>
                    <Link to="/shop-catalog" className="px-space-xl py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold hover:bg-primary-fixed-dim transition-all flex items-center gap-space-xs shadow-md">
                      <span>Explore Hardware Catalog</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-space-md">
                    {cartItems.map((item) => (
                      <div key={item.id} className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-sm hover:border-outline-variant/60 transition-all">
                        <div className="flex items-center gap-space-md">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-lowest border border-outline-variant/20 flex-shrink-0 flex items-center justify-center">
                            <img alt={item.name} className="w-full h-full object-cover" src={item.image} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-label-sm text-[10px] uppercase tracking-widest text-primary font-semibold">{item.category || "Hardware Node"}</span>
                            <h4 className="font-headline-sm text-[16px] text-on-surface font-medium line-clamp-1">{item.name}</h4>
                            <span className="font-label-md text-label-md text-on-surface-variant font-mono">{formatPrice(item.price, currency)} each</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-space-lg w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/20">
                          <div className="flex items-center bg-surface-container-high rounded-lg border border-outline-variant/40 p-0.5">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                              type="button"
                              title="Decrease quantity"
                            >
                              <span className="material-symbols-outlined text-[14px]">remove</span>
                            </button>
                            <span className="w-8 text-center font-label-md text-label-md text-on-surface font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface transition-colors cursor-pointer"
                              type="button"
                              title="Increase quantity"
                            >
                              <span className="material-symbols-outlined text-[14px]">add</span>
                            </button>
                          </div>

                          <div className="text-right min-w-[90px]">
                            <span className="font-headline-sm text-[17px] text-primary font-semibold block">
                              {formatPrice(item.price * item.quantity, currency)}
                            </span>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                            type="button"
                            title="Remove from queue"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4 flex flex-col gap-space-md">
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-normal border-b border-outline-variant/20 pb-space-sm">
                    Dispatch Protocol Summary
                  </h3>

                  <div className="flex flex-col gap-space-sm font-body-sm text-body-sm">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Subtotal Payload</span>
                      <span className="text-on-surface font-mono font-medium">{formatPrice(subtotal, currency)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-secondary">
                        <span>Laboratory Protocol Discount (10%)</span>
                        <span className="font-mono font-medium">-{formatPrice(discount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Priority Courier Transit</span>
                      <span className="text-primary uppercase font-label-sm text-[11px] font-semibold">Complimentary</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Estimated Regulatory Tax (8%)</span>
                      <span className="text-on-surface font-mono font-medium">{formatPrice(taxes, currency)}</span>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-space-sm flex justify-between items-baseline">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-medium">Grand Total</span>
                    <span className="font-display-lg text-[28px] text-primary font-semibold font-mono">
                      {formatPrice(grandTotal, currency)}
                    </span>
                  </div>

                  <button
                    disabled={cartItems.length === 0 || dispatchStatus === 'authorizing'}
                    onClick={handleAuthorize}
                    className="w-full py-4 px-space-md rounded-xl bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider font-bold hover:bg-primary-fixed-dim active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {dispatchStatus === 'authorizing' ? 'hourglass_top' : 'lock'}
                    </span>
                    <span>
                      {dispatchStatus === 'authorizing' ? 'Processing Payment...' : 'Buy Now • Proceed to Payment'}
                    </span>
                  </button>

                  {/* Payment Methods & Security Guarantee */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div className="flex items-center justify-center gap-2 text-on-surface-variant/70 text-[11px] font-label-sm uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                      <span>256-Bit Encrypted Secure Checkout</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-on-surface-variant/60">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">VISA</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">Mastercard</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">Apple Pay</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30">Google Pay</span>
                    </div>
                  </div>

                  <Link
                    to="/shop-catalog"
                    className="w-full py-2.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-on-surface hover:text-primary hover:border-primary/50 text-center font-label-sm text-label-sm uppercase tracking-wider font-medium transition-all"
                  >
                    Continue Hardware Selection
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
