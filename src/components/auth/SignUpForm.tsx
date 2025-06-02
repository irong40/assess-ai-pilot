
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SignUpForm = () => {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    general?: string;
  }>({});

  const sanitizeInput = (input: string) => {
    return input.replace(/[<>'"&]/g, '');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'edu', 'gov', 'mil', 'org', 'com', 'net'];
    
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    return allowedDomains.some(allowed => domain.endsWith(allowed));
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return checks;
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    const sanitizedFirstName = sanitizeInput(firstName.trim());
    if (!sanitizedFirstName) {
      newErrors.firstName = "First name is required";
    } else if (sanitizedFirstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email from an approved domain";
    }
    
    const passwordChecks = validatePassword(password);
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number) {
      newErrors.password = "Password must be at least 8 characters with uppercase, lowercase, and number";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    const checks = validatePassword(password);
    const score = Object.values(checks).filter(Boolean).length;
    
    if (score < 2) return { strength: 0, text: "Very Weak", color: "bg-red-500" };
    if (score < 3) return { strength: 1, text: "Weak", color: "bg-orange-500" };
    if (score < 4) return { strength: 2, text: "Fair", color: "bg-yellow-500" };
    if (score < 5) return { strength: 3, text: "Good", color: "bg-blue-500" };
    return { strength: 4, text: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();
  const passwordChecks = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const sanitizedFirstName = sanitizeInput(firstName.trim());
      const sanitizedLastName = sanitizeInput(lastName.trim());
      
      const { error } = await signUp(email.toLowerCase().trim(), password, sanitizedFirstName, sanitizedLastName);
      
      if (error) {
        if (error.message.includes("already registered")) {
          setErrors({ general: "An account with this email already exists. Try signing in instead." });
        } else if (error.message.includes("rate limit")) {
          setErrors({ general: "Too many signup attempts. Please wait a few minutes and try again." });
        } else {
          setErrors({ general: error.message });
        }
      }
    } catch (err) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {errors.general}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors({ ...errors, firstName: undefined });
              }}
              className={`pl-10 bg-white/20 border-white/30 text-white placeholder:text-slate-300 ${
                errors.firstName ? "border-red-500/50" : ""
              }`}
              maxLength={50}
              required
            />
          </div>
          {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName}</p>}
        </div>
        <Input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="bg-white/20 border-white/30 text-white placeholder:text-slate-300"
          maxLength={50}
        />
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            className={`pl-10 bg-white/20 border-white/30 text-white placeholder:text-slate-300 ${
              errors.email ? "border-red-500/50" : ""
            }`}
            maxLength={100}
            required
          />
        </div>
        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            className={`pl-10 pr-10 bg-white/20 border-white/30 text-white placeholder:text-slate-300 ${
              errors.password ? "border-red-500/50" : ""
            }`}
            maxLength={128}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        {password && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-white/10 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${passwordStrength.color} ${
                    passwordStrength.strength === 0 ? "w-1/5" :
                    passwordStrength.strength === 1 ? "w-2/5" :
                    passwordStrength.strength === 2 ? "w-3/5" :
                    passwordStrength.strength === 3 ? "w-4/5" :
                    "w-full"
                  }`}
                />
              </div>
              <span className="text-xs text-slate-300">{passwordStrength.text}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className={`flex items-center space-x-1 ${passwordChecks.length ? 'text-green-400' : 'text-slate-400'}`}>
                {passwordChecks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.uppercase ? 'text-green-400' : 'text-slate-400'}`}>
                {passwordChecks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Uppercase</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.lowercase ? 'text-green-400' : 'text-slate-400'}`}>
                {passwordChecks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Lowercase</span>
              </div>
              <div className={`flex items-center space-x-1 ${passwordChecks.number ? 'text-green-400' : 'text-slate-400'}`}>
                {passwordChecks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Number</span>
              </div>
            </div>
          </div>
        )}
        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
            }}
            className={`pl-10 pr-10 bg-white/20 border-white/30 text-white placeholder:text-slate-300 ${
              errors.confirmPassword ? "border-red-500/50" : ""
            }`}
            maxLength={128}
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {confirmPassword && password === confirmPassword && (
              <Check className="h-4 w-4 text-green-400" />
            )}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-300"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
      </div>
      
      <Button 
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            <span>Creating account...</span>
          </div>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
