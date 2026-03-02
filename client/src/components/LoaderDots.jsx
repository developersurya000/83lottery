function LoaderDots({ label }) {
  return (
    <div className="center-loader">
      {label && <span style={{ marginRight: 8 }}>{label}</span>}
      <div className="loader-dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

export default LoaderDots;
