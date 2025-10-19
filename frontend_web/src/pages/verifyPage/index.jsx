import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail, resendOtp } from "../../api/api";
import mascot from "../../assets/mascot.png";

const RESEND_COOLDOWN = 60;
const DIGITS = 6;

export default function VerifyEmailPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const stored = sessionStorage.getItem("pendingEmail") || "";
  const initialEmail = params.get("email") || stored;

  // read-only email (no input)
  const [email] = useState(initialEmail);

  const [code, setCode] = useState(Array(DIGITS).fill(""));
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef([]);

  const disabledResend = useMemo(() => cooldown > 0, [cooldown]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function onDigitChange(i, val) {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < DIGITS - 1) inputsRef.current[i + 1]?.focus();
  }

  function onPaste(e) {
    const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    const next = [...code];
    for (let i = 0; i < DIGITS; i++) next[i] = text[i] || "";
    setCode(next);
    const last = Math.min(text.length, DIGITS) - 1;
    inputsRef.current[last > 0 ? last : 0]?.focus();
    e.preventDefault();
  }

  async function onVerify(e) {
    e.preventDefault();
    setError("");
    setOk("");

    const joined = code.join("");
    if (!email) {
      setError("Missing email. Go back and try again.");
      return;
    }
    if (joined.length !== DIGITS) {
      setError("Enter the 6-digit code.");
      return;
    }

    try {
      setIsLoading(true);
      await verifyEmail({ email, code: joined });
      setOk("Email verified! Redirecting to login…");
      sessionStorage.removeItem("pendingEmail");
      setTimeout(() => nav("/login"), 800);
    } catch (err) {
      setError(err?.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onResend() {
    setError("");
    setOk("");
    try {
      if (!email) {
        setError("Missing email. Go back and try again.");
        return;
      }
      await resendOtp({ email });
      setOk("New code sent. Please check your inbox or Spam folder.");
      setCooldown(RESEND_COOLDOWN);
      setCode(Array(DIGITS).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "Could not resend code.");
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Left panel */}
        <div className="w-full md:w-1/2 bg-blue-box p-10 flex flex-col justify-center items-center text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Almost there!
            <br /> Let’s verify your email
          </h2>
          <img src={mascot} alt="Readle Mascot" className="w-96 h-auto" />
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">
            Verify your email
          </h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            We sent a 6-digit code to{" "}
            <span className="font-semibold">{email || "your email"}</span>. The
            code expires in 10 minutes.
          </p>

          <form onSubmit={onVerify}>
            {/* OTP boxes */}
            <div
              className="flex items-center justify-between gap-2 mb-4"
              onPaste={onPaste}
            >
              {Array.from({ length: DIGITS }).map((_, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={code[i]}
                  onChange={(e) => onDigitChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[i] && i > 0) {
                      inputsRef.current[i - 1]?.focus();
                    }
                  }}
                  inputMode="numeric"
                  maxLength={1}
                  className="border rounded-lg w-12 h-12 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </div>
            )}
            {ok && (
              <div className="mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg px-4 py-2">
                {ok}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-300 flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={onResend}
              disabled={disabledResend || !email || isLoading}
              className={`rounded-lg px-4 py-2 border ${
                disabledResend || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              {disabledResend ? `Resend in ${cooldown}s` : "Resend code"}
            </button>

            <button
              type="button"
              onClick={() => nav("/login")}
              className="text-blue-500 hover:underline text-sm"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
