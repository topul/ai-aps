import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PageTransition } from '../components/effects/PageTransition';
import { CardGlow } from '../components/effects/ParticleBackground';
import { DataLoading } from '../components/effects/LoadingAnimation';

interface AIConfig {
  id: number;
  name: string;
  provider: string;
  api_base?: string;
  model: string;
  parameters: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

export default function AIConfigPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/ai-config');
      return response.data;
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.post(`http://localhost:8000/api/v1/ai-config/${id}/set-default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
    },
  });

  const testConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.post(`http://localhost:8000/api/v1/ai-config/${id}/test`);
      return response.data;
    },
  });

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await testConfigMutation.mutateAsync(id);
      alert(result.status === 'success' ? '测试成功！' : `测试失败: ${result.message}`);
    } catch (error) {
      alert('测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const providerLabels: Record<string, string> = {
    claude: 'Claude (Anthropic)',
    openai: 'OpenAI',
    custom: '自定义API',
  };

  const providerColors: Record<string, string> = {
    claude: 'bg-neon-purple/20 text-neon-purple',
    openai: 'bg-tech-cyan/20 text-tech-cyan',
    custom: 'bg-tech-blue/20 text-tech-blue',
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <h2 className="text-3xl font-bold text-gradient">AI配置管理</h2>
          <p className="text-muted-foreground mt-1">配置和管理大模型API接入</p>
        </div>

        {/* 添加按钮 */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddDialog(true)}
            className="btn-neon"
          >
            <span className="mr-2">+</span>
            添加AI配置
          </button>
        </div>

        {/* 配置列表 */}
        <CardGlow>
          <div className="card-tech">
            {isLoading ? (
              <DataLoading message="加载AI配置..." />
            ) : configs && configs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config: AIConfig) => (
                  <div
                    key={config.id}
                    className="data-panel relative group"
                  >
                    {/* 默认标签 */}
                    {config.is_default && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded text-xs bg-gradient-tech text-white shadow-neon-blue">
                          默认
                        </span>
                      </div>
                    )}

                    {/* 配置信息 */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {config.name}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs ${providerColors[config.provider]}`}>
                          {providerLabels[config.provider]}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">模型:</span>
                          <span className="text-tech-cyan font-mono">{config.model}</span>
                        </div>

                        {config.api_base && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">API:</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {config.api_base}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">状态:</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            config.is_active
                              ? 'bg-tech-cyan/20 text-tech-cyan'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {config.is_active ? '激活' : '未激活'}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-3 border-t border-tech-blue/20">
                        <button
                          onClick={() => handleTest(config.id)}
                          disabled={testingId === config.id}
                          className="flex-1 px-3 py-1.5 text-sm bg-tech-blue/20 hover:bg-tech-blue/30 text-tech-blue rounded transition-colors disabled:opacity-50"
                        >
                          {testingId === config.id ? '测试中...' : '测试'}
                        </button>

                        {!config.is_default && (
                          <button
                            onClick={() => setDefaultMutation.mutate(config.id)}
                            className="flex-1 px-3 py-1.5 text-sm bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple rounded transition-colors"
                          >
                            设为默认
                          </button>
                        )}

                        <button className="px-3 py-1.5 text-sm bg-muted/20 hover:bg-muted/30 text-muted-foreground rounded transition-colors">
                          编辑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12">
                <div className="text-muted-foreground">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-lg mb-2">暂无AI配置</p>
                  <p className="text-sm mb-6">添加AI配置以启用智能对话功能</p>
                  <button
                    onClick={() => setShowAddDialog(true)}
                    className="btn-neon"
                  >
                    <span className="mr-2">+</span>
                    添加第一个配置
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardGlow>

        {/* 使用说明 */}
        <CardGlow>
          <div className="card-tech">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-tech rounded-full" />
              使用说明
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-tech-blue/10 rounded-lg border border-tech-blue/20">
                <div className="text-tech-cyan font-semibold mb-2">Claude API</div>
                <p className="text-muted-foreground">
                  使用Anthropic的Claude系列模型，支持claude-3-5-sonnet等最新模型
                </p>
              </div>
              <div className="p-4 bg-tech-cyan/10 rounded-lg border border-tech-cyan/20">
                <div className="text-tech-cyan font-semibold mb-2">OpenAI API</div>
                <p className="text-muted-foreground">
                  使用OpenAI的GPT系列模型，支持gpt-4、gpt-3.5-turbo等
                </p>
              </div>
              <div className="p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/20">
                <div className="text-neon-purple font-semibold mb-2">自定义API</div>
                <p className="text-muted-foreground">
                  兼容OpenAI格式的任何API，如本地部署的模型服务
                </p>
              </div>
            </div>
          </div>
        </CardGlow>

        {/* 添加配置对话框（简化版） */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-dark-card border border-tech-blue/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-glow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gradient">添加AI配置</h3>
              <p className="text-muted-foreground text-sm mb-4">
                功能开发中，请通过API直接添加配置
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 px-4 py-2 bg-muted/20 hover:bg-muted/30 text-white rounded transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
