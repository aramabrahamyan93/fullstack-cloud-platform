type OrganizationsPageProps = {
  isAuthenticated: boolean;
};

export function OrganizationsPage({
  isAuthenticated
}: OrganizationsPageProps) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h1>Workspaces</h1>
          <p className="card-subtitle">
            Organization and workspace management will be connected in the next step.
          </p>
        </div>
      </div>

      {isAuthenticated ? (
        <div className="empty-state">
          Workspace list and creation form will appear here.
        </div>
      ) : (
        <div className="empty-state">
          Please login or register to manage workspaces.
        </div>
      )}
    </section>
  );
}
