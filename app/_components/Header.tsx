import Dock from './Dock';

const Header = () => {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-lg px-3 py-2 border"
    style={{
      backdropFilter: 'blur(var(--blur, 12px)) saturate(var(--saturate, 1.15));',
      background: 'oklch(from var(--card) l c h / var(--opacity, 0.3))'
    }}
    >
      <Dock />
    </header>
  );
};

export default Header;
