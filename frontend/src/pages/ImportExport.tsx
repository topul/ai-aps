import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const handleImportOrders = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/v1/import-export/orders/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (error: any) {
      setImportResult({
        status: 'error',
        message: error.response?.data?.detail || '导入失败',
      });
    } finally {
      setImporting(false);
      e.target.value = ''; // 重置文件输入
    }
  };

  const handleExportOrders = async () => {
    try {
      const response = await api.get('/api/v1/import-export/orders/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('导出失败');
    }
  };

  const handleExportSchedules = async () => {
    try {
      const response = await api.get('/api/v1/import-export/schedules/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `schedules_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('导出失败');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/api/v1/import-export/template/orders', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'order_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('下载模板失败');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">数据导入导出</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 导入订单 */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">导入订单</h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              从 Excel 文件批量导入订单数据
            </p>

            <div className="space-y-2">
              <button
                onClick={handleDownloadTemplate}
                className="w-full px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
              >
                下载导入模板
              </button>

              <label className="block">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportOrders}
                  disabled={importing}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className={`block w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-center cursor-pointer hover:bg-primary/90 ${
                    importing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {importing ? '导入中...' : '选择文件导入'}
                </label>
              </label>
            </div>

            {importResult && (
              <div
                className={`p-4 rounded-lg ${
                  importResult.status === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {importResult.status === 'success' ? (
                  <div className="space-y-2">
                    <p className="font-medium text-green-800">导入成功！</p>
                    <p className="text-sm text-green-700">
                      成功导入 {importResult.imported_count} / {importResult.total_rows} 条记录
                    </p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-orange-800">错误信息:</p>
                        <ul className="text-sm text-orange-700 list-disc list-inside max-h-40 overflow-y-auto">
                          {importResult.errors.map((error: string, idx: number) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-800">{importResult.message}</p>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Excel 格式要求:</p>
              <ul className="list-disc list-inside pl-2">
                <li>order_no: 订单号</li>
                <li>product_code: 产品编码</li>
                <li>quantity: 数量</li>
                <li>priority: 优先级 (0-2)</li>
                <li>due_date: 交期 (YYYY-MM-DD)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 导出数据 */}
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-4">导出数据</h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              将系统数据导出为 Excel 文件
            </p>

            <div className="space-y-2">
              <button
                onClick={handleExportOrders}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                导出订单数据
              </button>

              <button
                onClick={handleExportSchedules}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                导出排产结果
              </button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>导出内容:</p>
              <ul className="list-disc list-inside pl-2">
                <li>订单数据: 包含所有订单信息</li>
                <li>排产结果: 包含甘特图数据和统计信息</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">使用说明</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">导入订单流程:</h4>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>点击"下载导入模板"获取 Excel 模板</li>
              <li>在模板中填写订单数据</li>
              <li>确保产品编码在系统中已存在</li>
              <li>点击"选择文件导入"上传填好的 Excel 文件</li>
              <li>查看导入结果，如有错误请修正后重新导入</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">注意事项:</h4>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>订单号必须唯一，重复的订单号会被跳过</li>
              <li>产品编码必须在系统中存在，否则导入失败</li>
              <li>日期格式必须为 YYYY-MM-DD</li>
              <li>优先级范围为 0-2，数字越大优先级越高</li>
              <li>导入前建议先备份现有数据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
