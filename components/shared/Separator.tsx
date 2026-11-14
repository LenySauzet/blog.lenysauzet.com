const Separator = () => {
  return (
    <div
      className="w-full my-4 h-px"
      style={{
        backgroundImage:
          'linear-gradient(to right,var(--border) 50%, transparent 0)',
        backgroundSize: '8px 1px',
        backgroundRepeat: 'repeat-x',
      }}
    />
  );
};

export default Separator;
