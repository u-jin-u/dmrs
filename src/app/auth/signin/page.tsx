/**
 * Sign In Page
 */

import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Marketing Reports
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the dashboard
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with Google
            </button>
          </form>

          {process.env.NODE_ENV === "development" && (
            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("credentials", {
                  email: formData.get("email"),
                  redirectTo: "/dashboard",
                });
              }}
            >
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 text-center mb-2">
                    Development Only
                  </p>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="dev@example.com"
                  defaultValue="dev@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Dev Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
