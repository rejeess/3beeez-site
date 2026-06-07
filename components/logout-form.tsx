import { logoutAction } from "@/app/login/actions";

export function LogoutForm() {
  return (
    <form action={logoutAction}>
      <button className="button button-secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
