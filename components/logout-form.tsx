export function LogoutForm() {
  return (
    <form action="/api/logout" method="post">
      <button className="button button-secondary" type="submit">
        Sign out
      </button>
    </form>
  );
}
