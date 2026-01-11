import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, ArrowLeft, Eye, EyeOff, ShieldCheck, Globe } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nama minimal 2 karakter')
});

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard');
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    console.log(`Memulai proses ${isLogin ? 'Login' : 'Signup'}...`);

    try {
      const email = formData.email.trim();
      const password = formData.password;
      const fullName = formData.fullName.trim();

      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: 'Validasi Gagal',
            description: validation.error.errors[0].message,
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          console.error('Login error:', error);
          let message = error.message;
          if (error.message === 'Invalid login credentials') {
            message = 'Email atau password salah. Silakan periksa kembali atau daftar akun baru jika Anda adalah pengurus.';
          } else if (error.message === 'Email not confirmed') {
            message = 'Email belum dikonfirmasi. Silakan cek kotak masuk Anda.';
          }
          
          toast({
            title: 'Login Gagal',
            description: message,
            variant: 'destructive'
          });
        } else if (data.user) {
          console.log('Login berhasil:', data.user.id);
          toast({ title: 'Berhasil', description: 'Selamat datang kembali!' });
          navigate('/dashboard');
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName });
        if (!validation.success) {
          toast({
            title: 'Validasi Gagal',
            description: validation.error.errors[0].message,
            variant: 'destructive'
          });
          setIsLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          toast({
            title: 'Pendaftaran Gagal',
            description: signUpError.message,
            variant: 'destructive'
          });
        } else if (data.user) {
          console.log('Signup berhasil:', data.user.id);
          toast({
            title: 'Berhasil',
            description: 'Akun berhasil dibuat dan Anda telah masuk!'
          });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error Sistem',
        description: 'Terjadi kesalahan teknis yang tidak terduga.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.05)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.05)_50%,rgba(0,0,0,0.05)_75%,transparent_75%,transparent)] bg-[size:40px_40px] opacity-20" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-primary-foreground mb-8">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-xl font-normal tracking-tight uppercase">Sistem RT 10</span>
          </div>
          
          <h1 className="text-5xl font-normal text-white leading-tight tracking-tighter mb-4">
            Membangun Transparansi<br />Lingkungan Kita.
          </h1>
          <div className="text-white/80 text-base max-w-md font-normal leading-relaxed">
            Platform manajemen keuangan digital mandiri untuk warga RT 10/23 Blok N. 
            Akses laporan real-time, pantau iuran, dan pastikan setiap rupiah tercatat dengan benar.
          </div>
        </div>

        <div className="relative z-10 flex gap-12">
          <div className="space-y-1">
            <span className="block text-[10px] font-normal uppercase tracking-widest text-white/60">Pengguna Aktif</span>
            <span className="block text-xl font-normal text-white">40+ Rumah</span>
          </div>
          <div className="space-y-1">
            <span className="block text-[10px] font-normal uppercase tracking-widest text-white/60">Status Sistem</span>
            <div className="text-xl font-normal text-white flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Online
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <ShieldCheck className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-2xl font-normal tracking-tight text-foreground">
              {isLogin ? 'Selamat Datang' : 'Registrasi Admin'}
            </h2>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-widest mt-1">
              {isLogin ? 'Silakan masuk ke portal manajemen' : 'Buat akun pengurus baru'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="emerald-card p-6 space-y-4 shadow-sm border-border/40">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground ml-1">
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Contoh: Budi Santoso"
                      className="h-11 pl-10 bg-muted/20 border-border/50 rounded-lg text-sm focus:ring-primary/20"
                      disabled={isLoading}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground ml-1">
                  Email Kantor
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@rt10.com"
                    className="h-11 pl-10 bg-muted/20 border-border/50 rounded-lg text-sm focus:ring-primary/20"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-normal uppercase tracking-widest text-muted-foreground ml-1">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-11 pl-10 pr-10 bg-muted/20 border-border/50 rounded-lg text-sm focus:ring-primary/20"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-normal text-xs uppercase tracking-widest rounded-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-50" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </span>
                ) : (
                  <span>{isLogin ? 'Masuk Sekarang' : 'Daftar Akun'}</span>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <Button 
                type="button" 
                variant="ghost"
                className="w-full h-11 text-[11px] font-normal uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all rounded-lg"
                onClick={() => setIsLogin(!isLogin)}
                disabled={isLoading}
              >
                  {isLogin ? 'Belum punya akses? Daftar' : 'Sudah punya akses? Login'}
                </Button>
                
                {isLogin && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider mb-1">Bantuan Akses</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Jika Anda lupa password atau belum memiliki akun pengurus, silakan gunakan menu <strong>Daftar</strong>. 
                      Setiap akun baru yang terdaftar akan otomatis mendapatkan hak akses Admin.
                    </p>
                  </div>
                )}
                
                <div className="pt-2 flex flex-col items-center gap-4">
                <div className="w-8 h-[1px] bg-border/40" />
                <button 
                  type="button" 
                  className="group flex items-center justify-center gap-2 text-[10px] font-normal uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                  Kembali ke Laporan Publik
                </button>
              </div>
            </div>
          </form>

          <div className="pt-8 text-center">
            <div className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <Globe className="h-3 w-3" /> RT 10 Digital Ecosystem
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
