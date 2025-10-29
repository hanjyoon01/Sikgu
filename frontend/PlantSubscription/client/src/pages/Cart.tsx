import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Minus, Plus, ShoppingBag, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Cart() {
  const { items, itemCount, removeItem, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const totalCoins = items.reduce((total, item) => total + item.coins * item.quantity, 0);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // 장바구니의 모든 항목을 주문으로 생성
      const orderPromises = items.map((item) =>
        apiRequest("POST", "/api/orders", {
          plantId: item.id.toString(),
          plantName: item.name,
          size: item.size,
          coinsUsed: item.coins * item.quantity,
          quantity: item.quantity,
        })
      );
      return Promise.all(orderPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      clearCart();
      toast({
        title: "구매 완료!",
        description: "모든 식물이 성공적으로 구매되었습니다.",
      });
      setLocation("/mypage?tab=subscription");
    },
    onError: (error: any) => {
      if (error.error === "insufficient_coins") {
        toast({
          title: "보유 코인이 부족합니다",
          description: `현재 코인: ${error.currentCoins}, 필요 코인: ${error.requiredCoins}`,
          variant: "destructive",
        });
        setLocation("/subscription");
      } else {
        toast({
          title: "구매 실패",
          description: error.message || "다시 시도해주세요.",
          variant: "destructive",
        });
      }
    },
  });

  const handleRemove = (id: number, name: string) => {
    removeItem(id);
    toast({
      title: "상품 제거",
      description: `${name}이(가) 장바구니에서 제거되었습니다.`,
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "장바구니 비우기",
      description: "장바구니가 비워졌습니다.",
    });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "로그인이 필요합니다",
        description: "로그인 후 이용해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    checkoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-bg-soft">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" data-testid="cart-title">
          장바구니
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2" data-testid="empty-cart-message">
              장바구니가 비어있습니다
            </h2>
            <p className="text-gray-500 mb-6">
              원하는 식물을 장바구니에 담아보세요!
            </p>
            <Link href="/">
              <Button className="bg-forest text-white hover:bg-forest/90" data-testid="button-continue-shopping">
                쇼핑 계속하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 장바구니 아이템 목록 */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="bg-white" data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* 상품 이미지 */}
                      <Link href={`/plant/${item.id}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          data-testid={`cart-item-image-${item.id}`}
                        />
                      </Link>

                      {/* 상품 정보 */}
                      <div className="flex-1">
                        <Link href={`/plant/${item.id}`}>
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-forest cursor-pointer" data-testid={`cart-item-name-${item.id}`}>
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500" data-testid={`cart-item-size-${item.id}`}>
                          {item.size} 식물
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Leaf className="h-5 w-5 text-forest" />
                          <span className="text-lg font-bold text-forest" data-testid={`cart-item-coins-${item.id}`}>
                            {item.coins * item.quantity} 코인
                          </span>
                          <span className="text-sm text-gray-500">
                            ({item.coins} 코인 x {item.quantity})
                          </span>
                        </div>
                      </div>

                      {/* 수량 조절 */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium" data-testid={`cart-item-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 삭제 버튼 */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id, item.name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* 장바구니 비우기 버튼 */}
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                data-testid="button-clear-cart"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                장바구니 비우기
              </Button>
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-1">
              <Card className="bg-white sticky top-4">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4" data-testid="order-summary-title">
                    주문 요약
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span data-testid="total-items-label">총 상품 수</span>
                      <span data-testid="total-items-count">{itemCount}개</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span data-testid="total-coins-label">총 코인</span>
                      <div className="flex items-center space-x-2">
                        <Leaf className="h-6 w-6 text-forest" />
                        <span className="text-2xl text-forest" data-testid="total-coins-amount">
                          {totalCoins}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending}
                    className="w-full bg-forest text-white hover:bg-forest/90 py-6 text-lg" 
                    data-testid="button-checkout"
                  >
                    {checkoutMutation.isPending ? "결제 중..." : "결제하기"}
                  </Button>

                  <Link href="/">
                    <Button variant="outline" className="w-full mt-3" data-testid="button-continue-shopping-sidebar">
                      쇼핑 계속하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
