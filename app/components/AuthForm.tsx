import Link from "next/link";
import { useState } from "react";

type AuthFormProps = {
    type: 'login' | 'signup';
    onSubmit: (email:string, password: string) => Promise<void>;
    errorMessage?: string;
}

export default function AuthForm({ type, onSubmit, errorMessage }: AuthFormProps){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');



    async function handleLogin(e: React.FormEvent){
        e.preventDefault();
        await onSubmit(email, password);
    }


    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={((e) => handleLogin(e))}
        className="bg-white p-8 rounded-xl shadow-md space-y-6 max-w-md w-full text-black"
      >
        <h1 className="text-2xl font-semibold text-gray-800 text-center">{type === 'login' ? "LogIn" : "SignUp" }</h1>

        {errorMessage && <p className="text-red-600 text-sm text-center">{errorMessage}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition hover:cursor-pointer"
        >
          {type === 'login' ? "Log In" : "Sign Up"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
            {type === 'login' ? (
                <>
                Don’t have an account yet?
                <br />
                <Link href="/signup" className="text-blue-600 underline">
                    Sign up!
                </Link>
                </>
            ) : (
                <>
                Already have an account?
                <br />
                <Link href="/login" className="text-blue-600 underline">
                    Log in!
                </Link>
                </>
            )}
        </p>
      </form>
    </div>
    );
}