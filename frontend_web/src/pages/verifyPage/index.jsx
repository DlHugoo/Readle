import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail, resendOtp } from "../../api/api";

const RESEND_COOLDOWN = 60;
const DIGITS = 6;

export default function VerifyEmailPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const stored = localStorage.getItem("pendingEmail") || "";
  const [email, setEmail] = useState(params.get("email") || stored);
  const [code, setCode] = useState(Array(DIGITS).fill(""));
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [cooldown, setCooldown] = useState(0);
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

  async function onVerify(e) {
    e.preventDefault();
    setError(""); setOk("");
    const joined = code.join("");
    if (joined.length !== DIGITS) {
      setError("Enter the 6-digit code.");
      return;
    }
    try {
      await verifyEmail({ email, code: joined });
      setOk("Email verified! Redirecting to login…");
      localStorage.removeItem("pendingEmail");
      setTimeout(() => nav("/login"), 700);
    } catch (err) {
      setError(err.message || "Invalid or expired code");
    }
  }

  async function onResend() {
    setError(""); setOk("");
    try {
      await resendOtp({ email });
      setOk("New code sent. Check your inbox/spam.");
      setCooldown(RESEND_COOLDOWN);
      setCode(Array(DIGITS).fill(""));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Could not resend code");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-3">Verify your email</h1>
      <p className="text-sm text-gray-600 mb-4">
        We sent a 6-digit code to <strong>{email || "your email"}</strong>. It expires in 10 minutes.
      </p>

      <form onSubmit={onVerify} className="space-y-4">
        <input
          className="border rounded p-2 w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />

        <div className="flex gap-2 justify-between">
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
              className="border rounded w-12 h-12 text-center text-xl tracking-widest"
            />
          ))}
        </div>

        {error && <div className="text-red-600">{error}</div>}
        {ok && <div className="text-green-700">{ok}</div>}

        <button className="bg-emerald-600 text-white rounded p-2 w-full">Verify</button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onResend}
          disabled={disabledResend || !email}
          className={`rounded p-2 px-3 border ${disabledResend ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {disabledResend ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
