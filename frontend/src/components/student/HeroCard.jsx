import brandLogo from '../../assets/brand-logo.png'

export default function HeroCard() {
  return (
    <div>
      <img src={brandLogo} alt="Smart Study logo" />
      <h1>Smart Study</h1>
      <p>Study faster. Learn smarter.</p>
      <p>Dr. HNNCE · 2022 Scheme</p>
    </div>
  )
}
