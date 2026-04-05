/**
 * 工业AI主题配置
 */

export const industrialTheme = {
  colors: {
    // 主色调 - 科技蓝
    primary: {
      50: '#e6f1ff',
      100: '#b3d9ff',
      200: '#80c1ff',
      300: '#4da9ff',
      400: '#1a91ff',
      500: '#0066ff',  // 主蓝色
      600: '#0052cc',
      700: '#003d99',
      800: '#002966',
      900: '#001433',
    },

    // 荧光色（用于强调）
    neon: {
      blue: '#00d4ff',
      cyan: '#00ffff',
      purple: '#b24bf3',
      pink: '#ff006e',
    },

    // 深色背景
    background: {
      primary: '#0a0e27',    // 深蓝黑
      secondary: '#151932',  // 次级背景
      card: '#1a1f3a',       // 卡片背景
    },

    // 渐变色
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      tech: 'linear-gradient(135deg, #0066ff 0%, #00ccff 100%)',
      success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      dark: 'linear-gradient(180deg, #0a0e27 0%, #151932 100%)',
    },
  },

  // 阴影效果
  shadows: {
    neonBlue: '0 0 20px rgba(0, 212, 255, 0.5)',
    neonPurple: '0 0 20px rgba(178, 75, 243, 0.5)',
    neonCyan: '0 0 20px rgba(0, 255, 255, 0.5)',
    glowSm: '0 0 10px rgba(0, 102, 255, 0.3)',
    glowMd: '0 0 20px rgba(0, 102, 255, 0.4)',
    glowLg: '0 0 30px rgba(0, 102, 255, 0.5)',
  },

  // 动画配置
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // 间距
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },

  // 圆角
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
};

// 粒子背景配置
export const particleConfig = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: '#00d4ff',
    },
    shape: {
      type: 'circle',
    },
    opacity: {
      value: 0.5,
      random: true,
      anim: {
        enable: true,
        speed: 1,
        opacity_min: 0.1,
        sync: false,
      },
    },
    size: {
      value: 3,
      random: true,
      anim: {
        enable: true,
        speed: 2,
        size_min: 0.1,
        sync: false,
      },
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#0066ff',
      opacity: 0.3,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false,
    },
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: {
        enable: true,
        mode: 'grab',
      },
      onclick: {
        enable: true,
        mode: 'push',
      },
      resize: true,
    },
    modes: {
      grab: {
        distance: 140,
        line_linked: {
          opacity: 0.5,
        },
      },
      push: {
        particles_nb: 4,
      },
    },
  },
  retina_detect: true,
};

// 导出类型
export type IndustrialTheme = typeof industrialTheme;
export type ParticleConfig = typeof particleConfig;
