/**
 * 加载动画组件 - 工业AI风格
 */

export function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-20 h-20">
        {/* 外圈 */}
        <div className="absolute inset-0 border-4 border-tech-blue/30 border-t-tech-blue rounded-full animate-spin" />

        {/* 中圈 */}
        <div
          className="absolute inset-2 border-4 border-tech-cyan/30 border-t-tech-cyan rounded-full animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />

        {/* 内圈 */}
        <div
          className="absolute inset-4 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin"
          style={{ animationDuration: '2s' }}
        />

        {/* 中心点 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-tech-cyan rounded-full animate-pulse shadow-neon-cyan" />
        </div>
      </div>
    </div>
  );
}

/**
 * 简单加载动画 - 用于按钮等小空间
 */
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={`${sizeClasses[size]} border-tech-blue/30 border-t-tech-blue rounded-full animate-spin ${className}`} />
  );
}

/**
 * 骨架屏加载 - 用于内容加载
 */
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-dark-secondary rounded mb-2" />
      <div className="h-4 bg-dark-secondary rounded w-5/6 mb-2" />
      <div className="h-4 bg-dark-secondary rounded w-4/6" />
    </div>
  );
}

/**
 * 进度条加载
 */
export function ProgressBar({ progress, className = '' }: { progress: number; className?: string }) {
  return (
    <div className={`w-full bg-dark-secondary rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-tech transition-all duration-300 ease-out relative"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      >
        {/* 流动效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>
    </div>
  );
}

/**
 * 数据加载动画 - 带文字提示
 */
export function DataLoading({ message = '加载中...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <LoadingAnimation />
      <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
    </div>
  );
}
