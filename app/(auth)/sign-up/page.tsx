import { signUpAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import AuthOAuthButton from "@/components/auth-oauth-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function SignUp(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <form
      className="flex-1 flex flex-col w-full max-w-sm mx-auto mt-24"
      action={signUpAction}
    >
      <h1 className="text-2xl font-medium">Sign up</h1>
      <p className="text-sm text-foreground">
        Already have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-in">
          Sign in
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
        />
        <AuthSubmitButton />
        <FormMessage message={searchParams} />
      </div>
      
      <div className="flex flex-col gap-2 mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <AuthOAuthButton provider="google" />
        <AuthOAuthButton provider="github" />
      </div>
    </form>
  );
}
