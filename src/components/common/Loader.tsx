interface Props {
  loadingText: string;
}

const Loader = ({ loadingText }: Props) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-16 flex items-center">
      {/* <div className=""> */}
      <div className="h-12 w-12 rounded-full border-4 border-current border-r-transparent animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <div className="m-6 text-3xl">
        {loadingText}
        <span
          className="ml-1"
          style={{ animation: "dotBlink 1.5s infinite linear" }}
        >
          .
        </span>
      </div>
      {/* </div> */}
      <style jsx>{`
        @keyframes dotBlink {
          0%,
          20% {
            color: rgba(0, 0, 0, 0);
            text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
          }
          40% {
            color: black;
            text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
          }
          60% {
            text-shadow: 0.25em 0 0 black, 0.5em 0 0 rgba(0, 0, 0, 0);
          }
          80%,
          100% {
            text-shadow: 0.25em 0 0 black, 0.5em 0 0 black;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
