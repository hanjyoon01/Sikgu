import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Leaf, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email format validation
    if (!isEmailValid) {
      toast({
        title: "이메일 오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const token = await response.text();
        // Bearer token을 sessionStorage에 저장
        sessionStorage.setItem("bearerToken", token);
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
        setLocation("/");
      } else {
        const errorText = await response.text();
        toast({
          title: "로그인 실패",
          description: errorText || "이메일 또는 비밀번호를 확인해주세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-forest hover:text-forest/90 transition-colors duration-200" data-testid="logo">
              식구
            </Link>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto mt-16" data-testid="login-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="login-title">
            로그인
          </CardTitle>
          <p className="text-gray-600 mt-2" data-testid="login-description">
            식구 계정으로 로그인하세요
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full"
                data-testid="input-email"
              />
              {email && (
                <div className="flex items-center text-sm mt-1">
                  {isEmailValid ? (
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={isEmailValid ? "text-green-500" : "text-red-500"}>
                    {isEmailValid ? "올바른 이메일 형식" : "이메일 형식이 아닙니다"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-forest text-white hover:bg-forest/90 py-2"
              disabled={isLoading || !isEmailValid || !password}
              data-testid="button-login"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600" data-testid="signup-prompt">
              아직 계정이 없으신가요?
            </p>
            <Link href="/signup">
              <Button
                variant="outline"
                className="mt-2 w-full border-forest text-forest hover:bg-forest hover:text-white"
                data-testid="button-signup"
              >
                회원가입
              </Button>
            </Link>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-forest hover:text-forest/80" data-testid="link-forgot-password">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}