interface TemplateRow {
  headers: string[];
  exampleRows: string[][];
}

export const templates: Record<string, TemplateRow> = {
  material: {
    headers: ['物料编码', '物料名称', '规格', '单位', '安全库存', '提前期(天)', '供应商'],
    exampleRows: [
      ['M001', '螺丝', 'M10*50', '个', '100', '3', '供应商A'],
      ['M002', '螺母', 'M10', '个', '200', '3', '供应商A'],
    ],
  },
  bom: {
    headers: ['BOM编码', '产品编码', '物料编码', '数量', '工序序号'],
    exampleRows: [
      ['BOM001', 'P001', 'M001', '10', '1'],
      ['BOM001', 'P001', 'M002', '5', '1'],
    ],
  },
  resource: {
    headers: ['资源编码', '资源名称', '类型', '产能'],
    exampleRows: [
      ['R001', '生产线A', 'machine', '100'],
      ['R002', '工人组A', 'worker', '50'],
    ],
  },
  'process-route': {
    headers: ['工艺路线编码', '产品编码', '工序序号', '资源编码', '标准工时(分钟)'],
    exampleRows: [
      ['PR001', 'P001', '1', 'R001', '60'],
      ['PR001', 'P001', '2', 'R002', '30'],
    ],
  },
};

export function generateTemplateCSV(type: string): string {
  const template = templates[type];
  if (!template) return '';

  const headers = template.headers.join(',');
  const examples = template.exampleRows.map(row => row.join(',')).join('\n');
  return `${headers}\n${examples}`;
}

export function downloadTemplate(type: string, filename?: string) {
  const template = templates[type];
  if (!template) return;

  const csv = generateTemplateCSV(type);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename || type}_template.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}