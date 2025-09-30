const CartView = () => {
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + (item.service.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const order: Order = {
        id: Date.now().toString(),
        investorId: currentInvestor!.id,
        items: cart,
        totalAmount,
        paymentMethod: 'bank_transfer',
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
        notes: orderNotes
      };

      await makeAPIRequest('createOrder', { data: order });
      setOrders([...orders, order]);
      setCart([]);
      setOrderNotes('');
      alert('Order submitted successfully! Please proceed with bank transfer.');
    } catch (error) {
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Shopping Cart</CardTitle>
          <CardDescription>Review your selected services</CardDescription>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Your cart is empty</p>
              <Button
                onClick={() => setActiveTab('marketplace')}
                className="mt-4"
                variant="outline"
              >
                Browse Services
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.serviceId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.service.name}</h4>
                    <p className="text-sm text-gray-600">{item.service.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          if (item.quantity > 1) {
                            setCart(cart.map(i =>
                              i.serviceId === item.serviceId
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                            ));
                          } else {
                            setCart(cart.filter(i => i.serviceId !== item.serviceId));
                          }
                        }}
                        variant="outline"
                        className="px-2 py-1"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        onClick={() => {
                          setCart(cart.map(i =>
                            i.serviceId === item.serviceId
                              ? { ...i, quantity: i.quantity + 1 }
                              : i
                          ));
                        }}
                        variant="outline"
                        className="px-2 py-1"
                      >
                        +
                      </Button>
                    </div>
                    <p className="font-bold text-gray-900 w-24 text-right">
                      ${(item.service.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</span>
                </div>

                <div className="mb-4">
                  <Label htmlFor="order-notes">Order Notes (Optional)</Label>
                  <textarea
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full border p-2 rounded mt-1"
                    rows={3}
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};