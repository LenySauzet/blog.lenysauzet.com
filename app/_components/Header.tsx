import Dock from './Dock';

const Header = () => {
  return (
    <header
      className="fixed bottom-6 sm:bottom-auto sm:top-6 left-1/2 -translate-x-1/2 z-50 rounded-xl px-3 py-2 border border-border/60 bg-card/50 backdrop-blur-md backdrop-saturate-[115%]"
    >
      <Dock />
    </header>
  );
};

export default Header;
