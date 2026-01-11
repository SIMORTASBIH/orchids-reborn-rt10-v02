import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Camera, Save, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { profile, isLoading, updateProfile, uploadAvatar, updatePassword } = useProfile();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) return;
    setIsUpdatingProfile(true);
    const result = await updateProfile({ full_name: fullName });
    if (result.success) {
      toast.success('Profil berhasil diperbarui');
    }
    setIsUpdatingProfile(false);
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      toast.error('Password tidak boleh kosong');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setIsUpdatingPassword(true);
    const result = await updatePassword(password);
    if (result.success) {
      toast.success('Password berhasil diperbarui');
      setPassword('');
      setConfirmPassword('');
    }
    setIsUpdatingPassword(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await uploadAvatar(file);
    if (result.success) {
      toast.success('Foto profil berhasil diperbarui');
    }
    setIsUploading(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Profil Pengguna</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mt-2 opacity-60">
            Personal Information & Security
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <Card className="md:col-span-1 rounded-2xl border shadow-sm overflow-hidden h-fit">
            <CardContent className="p-8 flex flex-col items-center space-y-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-xl">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/5 text-primary">
                    {fullName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
                </label>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg truncate w-full">{fullName || 'User'}</h3>
                <p className="text-xs text-muted-foreground truncate w-full">{profile?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <div className="md:col-span-2 space-y-8">
            <Card className="rounded-2xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-primary/5">
                <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2 group">
                  <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">
                    Nama Lengkap
                  </Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-medium"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2 group opacity-70">
                  <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground">
                    Alamat Email (Tidak dapat diubah)
                  </Label>
                  <Input
                    value={profile?.email || ''}
                    disabled
                    className="h-12 rounded-xl border bg-muted/30 font-medium cursor-not-allowed"
                  />
                </div>
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdatingProfile} 
                  className="w-full h-12 rounded-xl gap-2 font-bold uppercase text-xs tracking-widest bg-primary text-white shadow-lg shadow-primary/20"
                >
                  {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Simpan Perubahan
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b bg-destructive/5">
                <CardTitle className="text-sm font-bold flex items-center gap-3 uppercase tracking-wider text-destructive">
                  <div className="p-2 bg-destructive/10 rounded-xl">
                    <Lock className="h-4 w-4" />
                  </div>
                  Keamanan
                </CardTitle>
                <CardDescription className="text-[10px] pl-11 font-medium">Ubah kata sandi akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 group">
                    <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">
                      Password Baru
                    </Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-[10px] font-bold uppercase tracking-wider pl-1 text-muted-foreground group-focus-within:text-primary">
                      Konfirmasi Password
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl border bg-muted/30 focus-visible:ring-1 ring-primary/20 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isUpdatingPassword} 
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2 font-bold uppercase text-xs tracking-widest border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all"
                >
                  {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
