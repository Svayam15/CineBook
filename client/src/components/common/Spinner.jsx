const Spinner = ({ size = "4", text = "" }) => {
  const sizeClass = {
    "4": "h-4 w-4",
    "6": "h-6 w-6",
    "8": "h-8 w-8",
  }[size] || "h-4 w-4";

  return (
    <span className="flex items-center justify-center gap-2">
      <svg
        className={`animate-spin ${sizeClass} text-white`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
      {text && <span>{text}</span>}
    </span>
  );
};

export default Spinner;