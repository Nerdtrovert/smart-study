import '../../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__tagline">
          Helping students study smarter, not harder.
        </p>
        <p className="footer__credit">
          Developed by{' '}
          <a
            href="https://github.com/Nerdtrovert"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            Prajwal ❤️
          </a>
          {' '}and{' '}
          <a
            href="https://github.com/sudhanva1608"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            Sudhanva
          </a>
        </p>
      </div>
    </footer>
  )
}
