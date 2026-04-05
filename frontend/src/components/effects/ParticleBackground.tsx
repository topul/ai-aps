/**
 * 粒子背景组件 - CSS版本
 * 使用纯CSS实现粒子效果，不依赖外部库
 */

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-dark" />

      {/* 网格背景 */}
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* 动态光晕 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-tech-blue/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-tech-cyan/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '4s' }}
      />

      {/* CSS粒子效果 */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-tech-blue/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 简化版背景 - 性能模式
 */
export function SimpleBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 bg-grid opacity-10" />
    </div>
  );
}

/**
 * 卡片光晕效果
 */
export function CardGlow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {/* 光晕效果 */}
      <div className="absolute -inset-0.5 bg-gradient-tech opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 rounded-lg" />

      {/* 内容 */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

/**
 * 扫描线效果
 */
export function ScanlineEffect() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.1) 2px, rgba(0, 212, 255, 0.1) 4px)',
        }}
      />
    </div>
  );
}
