import { LoginForm } from "@/app/login/login-form";
import { Rule } from "@/components/atoms/rule";

export default function LoginPage(): React.JSX.Element {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="font-sans text-xs uppercase tracking-[0.2em] text-ink-muted">
          Demo Restaurant
        </p>
        <h1 className="mt-2 font-display text-5xl italic text-ink">Panel</h1>
        <Rule className="mt-6 mb-8" />
        <LoginForm />
      </div>
    </main>
  );
}
