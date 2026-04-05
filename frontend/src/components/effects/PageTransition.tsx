import { ReactNode } from 'react';

/**
 * 页面过渡动画组件
 * 使用CSS动画实现，避免依赖framer-motion（如果安装失败）
 */

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}

/**
 * 滑入动画
 */
export function SlideIn({ children, direction = 'left', className = '' }: PageTransitionProps & { direction?: 'left' | 'right' | 'up' | 'down' }) {
  const directionClasses = {
    left: 'animate-slide-in',
    right: 'animate-slide-out',
    up: 'animate-fade-in',
    down: 'animate-fade-in',
  };

  return (
    <div className={`${directionClasses[direction]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * 缩放动画
 */
export function ScaleIn({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`animate-scale-in ${className}`}>
      {children}
    </div>
  );
}

/**
 * 卡片展开动画
 */
export function CardReveal({ children, delay = 0, className = '' }: PageTransitionProps & { delay?: number }) {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * 列表项动画
 */
export function ListItemAnimation({ children, index = 0, className = '' }: PageTransitionProps & { index?: number }) {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {children}
    </div>
  );
}
