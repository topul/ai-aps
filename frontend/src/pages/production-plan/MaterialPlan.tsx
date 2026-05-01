import { useState, useEffect } from 'react';

export default function MaterialPlan() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-tech-blue border-t-transparent rounded-full animate-spin" /></div>;
  return <div className="space-y-6"><h2 className="text-2xl font-bold text-white">物料计划（甘特图）</h2><div className="p-8 rounded-lg bg-dark-card border border-tech-blue/20 text-center text-muted-foreground"><p>甘特图组件开发中...</p></div></div>;
}