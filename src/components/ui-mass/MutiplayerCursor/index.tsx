// ...existing imports

const MultiplayerCursor = () => {
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1000, // z-indexを設定
      pointerEvents: 'none'
    }}>
      {/* existing cursor components */}
    </div>
  );
};

export default MultiplayerCursor;