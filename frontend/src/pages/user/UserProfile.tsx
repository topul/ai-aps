import { User as UserIcon, Mail, Calendar } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';

export default function UserProfile() {
  const { user } = useUserStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white">用户信息</h2>

      <div className="p-6 rounded-lg bg-dark-card border border-tech-blue/20">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-tech flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-white">{user?.username || '用户'}</h3>
            <p className="text-muted-foreground">{user?.full_name || '未设置姓名'}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="w-5 h-5" />
            <span>{user?.email || '未设置邮箱'}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span>注册时间: 未知</span>
          </div>
        </div>
      </div>
    </div>
  );
}