export default function TopNav() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container">
        <a className="navbar-brand fw-bold" href="#">
          🏆 Liga dos Mestres
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto gap-2">
            <li className="nav-item">
              <a className="nav-link" href="#ranking">
                Ranking
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#rodadas">
                Rodadas
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#zoeira">
                Hall da Zoeira
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
