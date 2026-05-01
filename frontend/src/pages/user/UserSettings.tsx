import * as Tabs from '@radix-ui/react-tabs';
import { Cpu } from 'lucide-react';
import AIModelConfig from './AIModelConfig';

export default function UserSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">个人设置</h2>
      
      <Tabs.Root defaultValue="ai-model" className="space-y-4">
        <Tabs.List className="flex gap-2 border-b border-tech-blue/20">
          <Tabs.Trigger value="ai-model" className="flex items-center gap-2 px-4 py-2 text-muted-foreground data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-tech-cyan transition-colors">
            <Cpu className="w-4 h-4" />
            AI模型配置
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="ai-model">
          <AIModelConfig />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}