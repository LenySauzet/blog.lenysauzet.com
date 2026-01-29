interface BlendedTextProps {
  children: React.ReactNode;
}

const BlendedText = (props: BlendedTextProps) => {
  const { children } = props;
  return (
      <div
        style={{
          backgroundImage: 'linear-gradient(-22deg, #fff, #fff, rgba(255, 255, 255, 0.2) 90%)',
          color: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {children}
      </div>
  );
};

export default BlendedText;
