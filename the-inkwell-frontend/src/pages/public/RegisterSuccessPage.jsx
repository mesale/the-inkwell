import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function RegisterSuccessPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-8 font-body-md antialiased relative overflow-hidden">

      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <div className="bg-surface-container-lowest border border-surface-variant shadow-elevation-1 p-12 max-w-lg w-full text-center relative z-10">

        {/* Success icon */}
        <div className="w-24 h-24 bg-primary/10 border border-primary rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="display-sm text-primary mb-4">
          Welcome to the Library
        </h1>
        <p className="body-lg text-secondary leading-relaxed mb-10 pb-8 border-b border-surface-variant">
          Your reader profile has been officially created.
          Sign in now to begin exploring curated collections and rare finds.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={login}
            className="w-full btn-primary py-4 label-md"
          >
            Sign In to the Archive
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full btn-secondary py-4 label-md"
          >
            Browse Public Collections First
          </button>
        </div>

      </div>
    </div>
  );
}