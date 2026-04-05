import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, materialsApi, resourcesApi } from '../services/api';
import { PageTransition } from '../components/effects/PageTransition';
import { CardGlow } from '../components/effects/ParticleBackground';
import { DataLoading } from '../components/effects/LoadingAnimation';

type TabType = 'orders' | 'materials' | 'resources' | 'bom' | 'calendar';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list().then((res) => res.data),
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsApi.list().then((res) => res.data),
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => resourcesApi.list().then((res) => res.data),
  });

  const tabs = [
    { id: 'orders', label: '订单管理', icon: '📋' },
    { id: 'materials', label: '物料管理', icon: '📦' },
    { id: 'resources', label: '资源管理', icon: '⚙️' },
    { id: 'bom', label: 'BOM管理', icon: '🔗' },
    { id: 'calendar', label: '工作日历', icon: '📅' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* 标题 */}
        <div>
          <h2 className="text-3xl font-bold text-gradient">数据管理</h2>
          <p className="text-muted-foreground mt-1">管理订单、物料、资源、BOM和工作日历</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-tech-blue/20">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  px-6 py-3 border-b-2 transition-all duration-300 whitespace-nowrap
                  flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? 'border-tech-blue text-white bg-tech-blue/10'
                      : 'border-transparent text-muted-foreground hover:text-white hover:bg-tech-blue/5'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <CardGlow>
          <div className="card-tech">
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-tech rounded-full" />
                    订单列表
                  </h3>
                  <button className="btn-neon">
                    <span className="mr-2">+</span>
                    添加订单
                  </button>
                </div>

                {ordersLoading ? (
                  <DataLoading message="加载订单数据..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-tech-blue/20">
                          <th className="text-left p-3 text-muted-foreground font-medium">订单号</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">产品ID</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">数量</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">优先级</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">交期</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">状态</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders && orders.length > 0 ? (
                          orders.map((order: any) => (
                            <tr key={order.id} className="border-b border-tech-blue/10 hover:bg-tech-blue/5 transition-colors">
                              <td className="p-3 font-medium text-tech-cyan">{order.order_no}</td>
                              <td className="p-3">{order.product_id}</td>
                              <td className="p-3">{order.quantity}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  order.priority > 5 ? 'bg-neon-purple/20 text-neon-purple' : 'bg-tech-blue/20 text-tech-blue'
                                }`}>
                                  {order.priority}
                                </span>
                              </td>
                              <td className="p-3">{new Date(order.due_date).toLocaleDateString()}</td>
                              <td className="p-3">
                                <span className="px-2 py-1 rounded text-xs bg-tech-cyan/20 text-tech-cyan">
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <button className="text-tech-blue hover:text-tech-cyan transition-colors text-sm">
                                  编辑
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center p-12">
                              <div className="text-muted-foreground">
                                <div className="text-4xl mb-2">📋</div>
                                <p>暂无订单数据</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'materials' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-tech rounded-full" />
                    物料列表
                  </h3>
                  <button className="btn-neon">
                    <span className="mr-2">+</span>
                    添加物料
                  </button>
                </div>

                {materialsLoading ? (
                  <DataLoading message="加载物料数据..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-tech-blue/20">
                          <th className="text-left p-3 text-muted-foreground font-medium">物料编码</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">名称</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">单位</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">库存</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">提前期</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials && materials.length > 0 ? (
                          materials.map((material: any) => (
                            <tr key={material.id} className="border-b border-tech-blue/10 hover:bg-tech-blue/5 transition-colors">
                              <td className="p-3 font-medium text-tech-cyan">{material.material_code}</td>
                              <td className="p-3">{material.name}</td>
                              <td className="p-3">{material.unit}</td>
                              <td className="p-3">{material.stock_quantity}</td>
                              <td className="p-3">{material.lead_time}天</td>
                              <td className="p-3">
                                <button className="text-tech-blue hover:text-tech-cyan transition-colors text-sm">
                                  编辑
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center p-12">
                              <div className="text-muted-foreground">
                                <div className="text-4xl mb-2">📦</div>
                                <p>暂无物料数据</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-tech rounded-full" />
                    资源列表
                  </h3>
                  <button className="btn-neon">
                    <span className="mr-2">+</span>
                    添加资源
                  </button>
                </div>

                {resourcesLoading ? (
                  <DataLoading message="加载资源数据..." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-tech-blue/20">
                          <th className="text-left p-3 text-muted-foreground font-medium">资源编码</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">名称</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">类型</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">产能</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">状态</th>
                          <th className="text-left p-3 text-muted-foreground font-medium">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources && resources.length > 0 ? (
                          resources.map((resource: any) => (
                            <tr key={resource.id} className="border-b border-tech-blue/10 hover:bg-tech-blue/5 transition-colors">
                              <td className="p-3 font-medium text-tech-cyan">{resource.resource_code}</td>
                              <td className="p-3">{resource.name}</td>
                              <td className="p-3">{resource.type}</td>
                              <td className="p-3">{resource.capacity}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  resource.status === 'available'
                                    ? 'bg-tech-cyan/20 text-tech-cyan'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {resource.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <button className="text-tech-blue hover:text-tech-cyan transition-colors text-sm">
                                  编辑
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center p-12">
                              <div className="text-muted-foreground">
                                <div className="text-4xl mb-2">⚙️</div>
                                <p>暂无资源数据</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bom' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-tech rounded-full" />
                    BOM列表
                  </h3>
                  <button className="btn-neon">
                    <span className="mr-2">+</span>
                    添加BOM
                  </button>
                </div>

                <div className="text-center p-12">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">🔗</div>
                    <p className="text-lg mb-2">BOM管理</p>
                    <p className="text-sm">管理产品物料清单（Bill of Materials）</p>
                    <div className="mt-6 p-4 bg-tech-blue/10 rounded-lg border border-tech-blue/20 max-w-md mx-auto">
                      <p className="text-sm text-left">
                        <span className="text-tech-cyan">功能说明：</span><br/>
                        • 定义产品与物料的关系<br/>
                        • 设置物料用量和工序顺序<br/>
                        • 支持多层级BOM结构
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-tech rounded-full" />
                    工作日历
                  </h3>
                  <button className="btn-neon">
                    <span className="mr-2">+</span>
                    添加日历
                  </button>
                </div>

                <div className="text-center p-12">
                  <div className="text-muted-foreground">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-lg mb-2">工作日历管理</p>
                    <p className="text-sm">配置资源的工作时间和班次</p>
                    <div className="mt-6 p-4 bg-tech-blue/10 rounded-lg border border-tech-blue/20 max-w-md mx-auto">
                      <p className="text-sm text-left">
                        <span className="text-tech-cyan">功能说明：</span><br/>
                        • 设置工作日和休息日<br/>
                        • 配置班次时间（早班/中班/晚班）<br/>
                        • 支持节假日管理
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardGlow>
      </div>
    </PageTransition>
  );
}
