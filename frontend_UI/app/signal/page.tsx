import AlertCard from '@/components/AlertCard'

export default function SignalPage() {
  return (
    <section id="signal">
      <div className="section-content signal-content">
        <div className="s-left reveal-children">
          <span className="eyebrow">[ SIGNAL ]</span>
          <h2>Anomalies,<br />Surfaced.</h2>
          <p>Unusual patterns detected in real time. Every outlier explained, every risk scored before it reaches your balance.</p>
        </div>
        <div className="s-right reveal-children">
          <AlertCard
            merchant="Amazon Prime"
            amount="₹12,499"
            date="Apr 17"
            explanation="4.2× your monthly Amazon average. Possible duplicate charge or unrecognised subscription renewal."
            multiplier="4.2× your monthly average"
          />
          <AlertCard
            merchant="Zomato"
            amount="₹3,840"
            date="Apr 15"
            explanation="Restaurant spend 3.1× above your weekly baseline. Single-session order detected."
            multiplier="3.1× your weekly baseline"
          />
          <AlertCard
            merchant="Unknown Merchant"
            amount="₹6,200"
            date="Apr 12"
            explanation="No historical match found. New payee. Manual review recommended before next cycle."
            multiplier="First transaction detected"
          />
        </div>
      </div>
    </section>
  )
}
