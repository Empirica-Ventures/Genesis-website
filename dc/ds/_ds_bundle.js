/* @ds-bundle: {"format":3,"namespace":"GenesisEducationSolutionsDesignSystem_838a57","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"d1939b887ce2","components/core/Badge.jsx":"368967f13104","components/core/Button.jsx":"1f9d38a9c6cc","components/core/Card.jsx":"527727e8041c","components/core/Input.jsx":"06570bf964f9"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GenesisEducationSolutionsDesignSystem_838a57 = window.GenesisEducationSolutionsDesignSystem_838a57 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function Avatar({
  name,
  src,
  size = 'md',
  variant = 'circle',
  status
}) {
  const sizes = {
    xs: {
      dim: 24,
      font: '9px'
    },
    sm: {
      dim: 32,
      font: 'var(--text-xs)'
    },
    md: {
      dim: 40,
      font: 'var(--text-sm)'
    },
    lg: {
      dim: 56,
      font: 'var(--text-md)'
    },
    xl: {
      dim: 72,
      font: 'var(--text-xl)'
    },
    '2xl': {
      dim: 96,
      font: 'var(--text-2xl)'
    }
  };
  const {
    dim,
    font
  } = sizes[size];
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

  // Generate a deterministic color from the name
  const colors = [['var(--color-teal-500)', 'var(--color-teal-100)'], ['var(--color-cyan-600)', 'var(--color-cyan-100)'], ['var(--color-coral-500)', 'var(--color-coral-100)'], ['var(--color-charcoal-700)', 'var(--color-charcoal-100)']];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  const [fg, bg] = colors[colorIdx];
  const radii = {
    circle: '50%',
    rounded: 'var(--radius-lg)',
    square: 'var(--radius-sm)'
  };
  const statusColors = {
    online: 'var(--color-success)',
    away: 'var(--color-warning)',
    offline: 'var(--color-gray-400)',
    busy: 'var(--color-error)'
  };
  return React.createElement('div', {
    style: {
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0
    }
  }, React.createElement('div', {
    style: {
      width: dim,
      height: dim,
      borderRadius: radii[variant],
      background: src ? 'transparent' : bg,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, src ? React.createElement('img', {
    src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : React.createElement('span', {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: font,
      fontWeight: 'var(--weight-bold)',
      color: fg,
      userSelect: 'none'
    }
  }, initials)), status && React.createElement('span', {
    style: {
      position: 'absolute',
      bottom: '1px',
      right: '1px',
      width: Math.max(8, dim * 0.22),
      height: Math.max(8, dim * 0.22),
      borderRadius: '50%',
      background: statusColors[status],
      border: '2px solid white'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)',
    lineHeight: '1',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em'
  };
  const sizes = {
    sm: {
      fontSize: '10px',
      padding: '3px 8px'
    },
    md: {
      fontSize: 'var(--text-xs)',
      padding: '4px 10px'
    },
    lg: {
      fontSize: 'var(--text-sm)',
      padding: '6px 12px'
    }
  };
  const variants = {
    default: {
      background: 'var(--color-gray-100)',
      color: 'var(--color-gray-700)'
    },
    primary: {
      background: 'var(--color-teal-100)',
      color: 'var(--color-teal-700)'
    },
    accent: {
      background: 'var(--color-cyan-100)',
      color: 'var(--color-cyan-700)'
    },
    coral: {
      background: 'var(--color-coral-100)',
      color: 'var(--color-coral-700)'
    },
    success: {
      background: 'var(--color-success-bg)',
      color: 'var(--color-success)'
    },
    warning: {
      background: 'var(--color-warning-bg)',
      color: 'var(--color-warning)'
    },
    error: {
      background: 'var(--color-error-bg)',
      color: 'var(--color-error)'
    },
    brand: {
      background: 'var(--color-teal-500)',
      color: '#ffffff'
    },
    dark: {
      background: 'var(--color-charcoal-700)',
      color: '#ffffff'
    }
  };
  const dotColors = {
    default: 'var(--color-gray-500)',
    primary: 'var(--color-teal-500)',
    accent: 'var(--color-cyan-500)',
    coral: 'var(--color-coral-500)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    brand: '#ffffff',
    dark: '#ffffff'
  };
  const style = {
    ...base,
    ...sizes[size],
    ...variants[variant]
  };
  return React.createElement('span', {
    style
  }, dot && React.createElement('span', {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: dotColors[variant],
      flexShrink: 0
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  onClick,
  type = 'button'
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)',
    lineHeight: '1',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--transition-base)',
    textDecoration: 'none',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em'
  };
  const sizes = {
    sm: {
      fontSize: 'var(--text-sm)',
      padding: '6px 14px',
      borderRadius: 'var(--radius-md)'
    },
    md: {
      fontSize: 'var(--text-base)',
      padding: '10px 20px',
      borderRadius: 'var(--radius-lg)'
    },
    lg: {
      fontSize: 'var(--text-md)',
      padding: '14px 28px',
      borderRadius: 'var(--radius-lg)'
    }
  };
  const variants = {
    primary: {
      background: 'var(--color-teal-500)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-brand)'
    },
    secondary: {
      background: 'var(--color-coral-500)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-coral)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-teal-500)',
      border: '2px solid var(--color-teal-500)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-teal-600)'
    },
    subtle: {
      background: 'var(--color-teal-50)',
      color: 'var(--color-teal-700)'
    },
    danger: {
      background: 'var(--color-coral-500)',
      color: '#ffffff'
    },
    white: {
      background: '#ffffff',
      color: 'var(--color-teal-600)',
      boxShadow: 'var(--shadow-sm)'
    }
  };
  const style = {
    ...base,
    ...sizes[size],
    ...variants[variant]
  };
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const hoverStyles = {
    primary: {
      background: 'var(--color-teal-600)'
    },
    secondary: {
      background: 'var(--color-coral-600)'
    },
    outline: {
      background: 'var(--color-teal-50)'
    },
    ghost: {
      background: 'var(--color-teal-50)'
    },
    subtle: {
      background: 'var(--color-teal-100)'
    },
    danger: {
      background: 'var(--color-coral-600)'
    },
    white: {
      background: 'var(--color-gray-50)'
    }
  };
  const activeStyle = pressed ? {
    transform: 'scale(0.97)'
  } : {};
  const hoverStyle = hovered && !disabled ? hoverStyles[variant] : {};
  return React.createElement('button', {
    type,
    disabled,
    onClick,
    style: {
      ...style,
      ...hoverStyle,
      ...activeStyle
    },
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => {
      setHovered(false);
      setPressed(false);
    },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false)
  }, iconLeft && React.createElement('span', {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, iconLeft), children, iconRight && React.createElement('span', {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, iconRight));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  children,
  padding = 'md',
  shadow = 'md',
  radius = 'lg',
  border = true,
  hoverable = false,
  style: extraStyle = {}
}) {
  const [hovered, setHovered] = React.useState(false);
  const paddings = {
    none: '0',
    sm: 'var(--space-4)',
    md: 'var(--space-6)',
    lg: 'var(--space-8)',
    xl: 'var(--space-10)'
  };
  const shadows = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)'
  };
  const radii = {
    sm: 'var(--radius-md)',
    md: 'var(--radius-lg)',
    lg: 'var(--radius-xl)',
    xl: 'var(--radius-2xl)'
  };
  const style = {
    background: 'var(--bg-primary)',
    borderRadius: radii[radius],
    padding: paddings[padding],
    border: border ? '1px solid var(--border-default)' : 'none',
    boxShadow: hovered && hoverable ? 'var(--shadow-lg)' : shadows[shadow],
    transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
    transform: hovered && hoverable ? 'translateY(-2px)' : 'translateY(0)',
    ...extraStyle
  };
  return React.createElement('div', {
    style,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false)
  }, children);
}
Card.Header = function CardHeader({
  children,
  style: extra = {}
}) {
  return React.createElement('div', {
    style: {
      paddingBottom: 'var(--space-4)',
      marginBottom: 'var(--space-4)',
      borderBottom: '1px solid var(--border-default)',
      ...extra
    }
  }, children);
};
Card.Body = function CardBody({
  children,
  style: extra = {}
}) {
  return React.createElement('div', {
    style: extra
  }, children);
};
Card.Footer = function CardFooter({
  children,
  style: extra = {}
}) {
  return React.createElement('div', {
    style: {
      paddingTop: 'var(--space-4)',
      marginTop: 'var(--space-4)',
      borderTop: '1px solid var(--border-default)',
      ...extra
    }
  }, children);
};
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function Input({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  size = 'md',
  error,
  hint,
  disabled = false,
  required = false,
  iconLeft,
  iconRight,
  fullWidth = true
}) {
  const [focused, setFocused] = React.useState(false);
  const sizes = {
    sm: {
      fontSize: 'var(--text-sm)',
      padding: '7px 12px',
      height: '34px'
    },
    md: {
      fontSize: 'var(--text-base)',
      padding: '9px 14px',
      height: '40px'
    },
    lg: {
      fontSize: 'var(--text-md)',
      padding: '11px 16px',
      height: '48px'
    }
  };
  const borderColor = error ? 'var(--color-error)' : focused ? 'var(--color-teal-500)' : 'var(--border-default)';
  const inputStyle = {
    ...sizes[size],
    width: fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-regular)',
    color: disabled ? 'var(--fg-disabled)' : 'var(--fg-1)',
    background: disabled ? 'var(--color-gray-50)' : 'var(--bg-primary)',
    border: `1.5px solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    paddingLeft: iconLeft ? '38px' : sizes[size].padding.split(' ')[1],
    paddingRight: iconRight ? '38px' : sizes[size].padding.split(' ')[1],
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    boxShadow: focused ? `0 0 0 3px var(--color-teal-100)` : 'none',
    cursor: disabled ? 'not-allowed' : 'text'
  };
  const wrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: fullWidth ? '100%' : undefined
  };
  const labelStyle = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: error ? 'var(--color-error)' : 'var(--fg-1)'
  };
  return React.createElement('div', {
    style: wrapStyle
  }, label && React.createElement('label', {
    htmlFor: id,
    style: labelStyle
  }, label, required && React.createElement('span', {
    style: {
      color: 'var(--color-coral-500)',
      marginLeft: '3px'
    }
  }, '*')), React.createElement('div', {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    }
  }, iconLeft && React.createElement('span', {
    style: {
      position: 'absolute',
      left: '12px',
      color: 'var(--fg-3)',
      display: 'flex',
      pointerEvents: 'none'
    }
  }, iconLeft), React.createElement('input', {
    id,
    type,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    style: inputStyle,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false)
  }), iconRight && React.createElement('span', {
    style: {
      position: 'absolute',
      right: '12px',
      color: 'var(--fg-3)',
      display: 'flex',
      pointerEvents: 'none'
    }
  }, iconRight)), (hint || error) && React.createElement('span', {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-xs)',
      color: error ? 'var(--color-error)' : 'var(--fg-3)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

})();
