export interface Order {
  id: number;
  order_no: string;
  product_id: number;
  quantity: number;
  priority: number;
  due_date: string;
  status: string;
  created_at: string;
}

export interface Material {
  id: number;
  material_code: string;
  name: string;
  unit: string;
  stock_quantity: number;
  lead_time: number;
  supplier?: string;
}

export interface Resource {
  id: number;
  resource_code: string;
  name: string;
  type: 'machine' | 'worker' | 'tool';
  capacity: number;
  status: 'available' | 'busy' | 'maintenance' | 'offline';
}

export interface Schedule {
  id: number;
  order_id: number;
  resource_id: number;
  start_time: string;
  end_time: string;
  status: string;
}

export interface BOM {
  id: number;
  product_id: number;
  material_id: number;
  quantity: number;
  sequence: number;
}

export interface Calendar {
  id: number;
  resource_id: number;
  date: string;
  shift_start: string;
  shift_end: string;
  is_working_day: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
