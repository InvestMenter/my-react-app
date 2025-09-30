const MarketplaceView = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Available Services</CardTitle>
        <CardDescription>Professional services for property investors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AVAILABLE_SERVICES.map(service => (
            <Card key={service.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.popular && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {service.price === 0 ? 'Commission' : `$${service.price.toLocaleString()}`}
                    </p>
                    <p className="text-sm text-gray-600">{service.deliveryTime}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="space-y-2 mb-4">
                  <p className="font-semibold text-sm text-gray-900">Features:</p>
                  <ul className="space-y-1">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={() => {
                    const existingItem = cart.find(item => item.serviceId === service.id);
                    if (existingItem) {
                      setCart(cart.map(item =>
                        item.serviceId === service.id
                          ? { ...item, quantity: item.quantity + 1 }
                          : item
                      ));
                    } else {
                      setCart([...cart, { serviceId: service.id, quantity: 1, service }]);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);