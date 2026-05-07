export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}
